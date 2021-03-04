const ReportCollection = require("../../reportCollection/model/Collection");
const Report = require("../model/Report");

const axios = require("axios");

//This api checks if there all data is updated and then save the data
exports.getData = (req, res) => {
    try {

      //Setup needed data
      var r_id = req.body.report_id;

      var time = {
        since: req.body.since,
        until: req.body.until
      };

      //Get the report meta data from db
      Report.findOne({_id: r_id})
      .then( function (report) {

        //Check if data is updated, if it is then send the data
        if (report.latest_date == todaysDate()){
          res.status(200).json({ msg: 'No data needed to be updated', data: report.data_weeks })
        }

        //SETUP TO GET NEW DATA

        //check the insight_data has an array of objects, if it doesnt then it is broke
        if (!Array.isArray(report.data_weeks)) {
          report.data_weeks = [];
          report.latest_date = returnLastMonth();
        }

        //If no data history needs to be fetched then return meta data
        if ( !report.data_history ) {
          //Get last months data from the network if available
          time.since = returnLastMonth();
        } 

        if (time.since == "null") {
          time.since = report.latest_date;
        }

        const networkSupported = reportsInterface.interfaceGuide(report.social_media);

        if (networkSupported) {
          //Run the networks function
          //This function needs to get all the insights data that is available from the media network
          reportsInterface[network](res, r_id, report.token, report.business_id, report.data_endpoint, report.insight_type, report.page_id, report.data_weeks, time);
        } else {
          res.status(201).json({ msg: 'Network was not supported, check the report for errors, sending previous data', data: report.data_weeks })
        }
        

        
      } )

    } catch (err) {

      console.log(err, 'Error finding report meta data');
      res.status(400).json({ err: err });

    }

}


//Reports library of functions to help with fetching data for reports

const reportsInterface = {
  supportedNetworks: ['facebook'],
  interfaceGuide: function(social_media) {
    //Move this function into the interface.
    this.supportedNetworks.forEach( function (network) {
      //Loop the current implemented social media networks until a match is reached
      if ( social_media == network ) {
        return true;
      }
    })
    //network not supported
    return false;
  },
  facebook: function (res, r_id, endpoint_token, b_id, endpoint, insight_type, p_id, insight_data, time) {
    
    if (endpoint_token == null || endpoint_token == 'null'){
        //GETS ANY SECURITY TOKENS NEEDED TO GRAB INSIGHTS
        //Get the needed tokens to perform the endpoint
        Facebook.returnToken(b_id).then((token)=>{ 
          axios.get(
            "https://graph.facebook.com/"+ p_id +"?fields=access_token&access_token=" + token
          )
          .then( (response) => {
            var page_token = response.data.access_token;
            //SAVE TOKEN TO REPORT
            Report.findOneAndUpdate({_id: r_id}, {$set:{'token': page_token}}, {new: true, useFindAndModify: false}, (err, doc) => {
                if (err) {
                    console.log({msg: "Something wrong when updating PAGE TOKEN", err: err} );
                }
                //GET ALL DATA function
                getNewData(page_token);
            });    
          })
          .catch( (response) => {

            console.log(response, 'error could not get page token')
            res.status(400).json({ err: response });
            
          } )
        });

    } else {
      // console.log('hasToken');
      //Use provided access token for endpoint
      //false because there is no document
      getNewData(endpoint_token);
    }

    // RETRIEVE FUNCTIONS

    function getNewData(token) {
      //THIS FUNCTION GRABS INSIGHTS DATA FROM FACEBOOK
      //Make request based on the endpoint and endpoint params

      // &since=2020-11-00&period=day EXAMPLE of extra params 

      //Replace endpoint variables
      var format_endpoint = endpoint.replace('$', p_id);
      var real_data;

      //Need to wait for this call to get the real data before continuing
      axios.get(
        format_endpoint, { params: { since: time.since, access_token: token }}
      )
      .then( (response) => {
        // Some responses might return iregular value structures
        if (typeof response.data.data[0].values == "undefined") {
          console.log(insight_type + " response values not recognised");
          res.status(400).json({ err: insight_type + " response values not recognised" });
        }

        //Before we handle the data we must check we have all data up to this date, if we don't then we need to use paging
        var vals = response.data.data[0].values;
        var today_date = todaysDate();
        var end_date = vals[vals.length-1].end_time.substring(0,10)
        if ( end_date == today_date ) {
          real_data = handleData(vals);
        } else {
          handlePaging(response.data.paging.next, today_date, vals).then( (new_vals) => {
            real_data = handleData(vals.concat(new_vals));
          } )
        }

      })    
      .catch( (response) => {

        console.log(response, 'error could not get '+ insight_type + ' data')
        //return err
        
      } )


    }

    async function handlePaging (paging_endpoint, final_date, old_vals) {
      // THIS FUNCTION GOES THROUGH FACEBOOK PAGING UNTIL WE HAVE REACHED THE DESIRED DATE
      var new_vals = [];

      var f_year = final_date.substring(0,4);
      var f_month = final_date.substring(5,7);
      var f_day = final_date.substring(8,10);

      await axios.get(
        paging_endpoint
      ).then( (res) => {
        var vals = res.data.data[0].values;
 
        for (var i = 0; i < vals.length; i++) {
          //KEEP AN EYE ON THIS FUNCTION
          var v_year = vals[i].end_time.substring(0,4)
          var v_month = vals[i].end_time.substring(5,7)
          var v_day = vals[i].end_time.substring(8,10)

          //Checking if the value is before the until/final date needed to be fetched

          if (v_year < f_year || v_month < f_month || v_month == f_month &&  v_day <= f_day) {
            new_vals.push(vals[i]);
          }
          else {
            break;
          }
        }

      } )
      return new_vals

      
    }

    function handleData(values) {
      //FUNCTION FORMATS AND SAVES DATA

      // Seperate values into weeks starting from the first value 

      // Each data week should be an obj: 
      //{ week_number: 'week', Since_until: 'firstdate-lastdate', total: 'total insight' ,
      // data: [  ]
      // }

      //TODO check for duplicates

      var weeks_data = insight_data;
      var current_week = {
        week_number: null,
        since_until: null,
        total: null,
        data: null
      };
      var day_counter = 0;
      var week_counter = 1; 
      var custom_counter = 6;
      //Work out what week we need to start from, the latest week or the week after the latest if the latest week is complete
      if (insight_data.length != 0) {
        // TODO custom counter need to have the date up to today
        custom_counter = returnCustomCounter(insight_data[insight_data.length-1].data[0].date); //Customer counter equal to the amount of days that need to be in this week
        if (insight_data[insight_data.length-1].data.length < custom_counter) {
          //still need to finish the current latest week
          week_counter = insight_data[insight_data.length-1].week_number
          day_counter = insight_data[insight_data.length-1].day 
          current_week = insight_data[insight_data.length-1]
        } 
        
      }
      var final_date = "";

      // Loop values, everytime the day counter reaches 7 create a new week object
      values.forEach( (v, i) => {
        if ( day_counter == 0 ) {
          current_week.week_number = week_counter;
          if ( typeof values[i+6] == 'undefined' ) {
            // No values exist for the rest of this week. v, i, values, 
            current_week.since_until = v.end_time.substring(0,10)+"-incomplete";
            //Custom counter for less than seven days
            custom_counter = values.length - i - 1;
          } else {
            //TODO check if this week is gonna have more than 7 days because it is at the end if the month
            custom_counter = returnCustomCounter(v.end_time.substring(0,10));
            console.log(i, custom_counter);
            current_week.since_until = v.end_time.substring(0,10)+"-"+values[i+custom_counter].end_time.substring(0,10);
            
          }
          current_week.total = 0;
          current_week.data = [];

        }

        current_week.total = current_week.total + parseInt(v.value);
        current_week.data.push( {
          day: day_counter,
          value: v.value,
          date: v.end_time.substring(0,10)
        } )



        //TODO A week can have more than seven records because some months go over 28 days.
        //custom counter refers to the amount of days when there isnt 7 days in the week
        if (day_counter == custom_counter) {
          weeks_data.push(current_week);
          week_counter++
          day_counter = 0;
          custom_counter = null;
          current_week = {
            week_number: null,
            since_until: null,
            total: null,
            data: null
          }
        } else {
          day_counter++;
        }

        

        if ( values.length-1 == i ) {
          final_date = v.end_time.substring(0,10);
          // console.log("finished formatting ready to save");
        }

      } )

      // console.log(weeks_data, 'we reached the end, here is the formatted data');
      Report.updateOne(
        { _id: r_id }, 
        { $set: {latest_date: final_date, data_history: true, data_weeks: weeks_data } },
        done
      );

      function done (doc, err) {
        res.status(200).json({ msg: 'Data history loaded ' + week_counter + ' weeks of data.', data: weeks_data })
        if (err) {
          console.log(err, 'error saving document');
          return false
        }
      } 
      
    }

    return;
  }

}

//HELPER FUNCTIONS

function returnLastMonth() {

  var lastMonth;
  var year;
  var timeStamp;
  // Get current month
  var d = new Date();
  var n = d.getMonth();
  var year = d.getFullYear()
  //Get last month
  if ( n == 0 ){
    lastMonth = '12';
    year = year - 1
  }
  else {
    lastMonth = n - 1;
  }
  //Create a timestamp
  timeStamp = year+"-"+lastMonth+"-00";
  return timeStamp;
}

function todaysDate () {
  var d = new Date(),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

function returnCustomCounter (first_date) {
  //Work out how many days should be in this data week
  //First date should be minimum 7 and may go above if it is the end of the month

  //We need the current months maximum day then subtract the values day and that will be the counter if it is below
  //7 then there has been a problem with formatting data into correct months or missing data as there is never less than 28 days

  //TODO is the date over the 21st, this means there could be more than seven days
  var current_day = first_date.substring(8,10);
  var days_left = 7;

  if (parseInt(current_day) > 21 ) {
    var year = first_date.substring(0,4)
    var month = first_date.substring(5,7)
    var month_days = new Date(year, month, 0).getDate();
    days_left = month_days - current_day + 1;
  }
  

  if ( days_left < 7 ) {
    console.log(first_date, 'has less than 7 days, data incorrect')
  }

  return days_left - 1;

}