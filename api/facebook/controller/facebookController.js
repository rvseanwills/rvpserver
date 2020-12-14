const Facebook = require("../model/Facebook");
const axios = require("axios");

exports.getNewStats = async (req, res) => {
  try {




    var business_id = req.body.business;
    var fbtoken = req.body.facebook.accessToken;
    var facebookuserid = req.body.facebook.userID;
    var facebookpageid = 'wemanagebusiness'; //GET THIS FROM DB
    var facebook_email;
    var facebook_pages;
    var client_id = '289313119164357';
    var client_secret = '0b93b8673fd6c51da81e6f03e30fb083';
    var longlivedtoken;
    var pagetoken;




    getLonglivedtoken();

    function getLonglivedtoken() {


      // LONG LIVED TOKEN RETRIEVAL
      axios.get("https://graph.facebook.com/v9.0/oauth/access_token?grant_type=fb_exchange_token&client_id=" + client_id
   +"&client_secret=" + client_secret +"&fb_exchange_token=" + fbtoken
      ).then( function (response) {
        longlivedtoken = response.data.access_token;

        getFacebookDetails();

      })
      .catch( function (err) {
        console.log(err)
        res.send({error_name: 'Could not get longlivedtoken',err: err.response})
      } )

    }

    
    



    function getFacebookDetails() {
      //Find facebook email using business id
      Facebook.findByCredential(business_id).then(function (facebook_details) {

         if (facebook_details == null) {
          res.send('Need to set up facebook model');
         }
         facebook_email = facebook_details.facebook_email;

         facebook_pages = facebook_details.pages;

         
         getPageToken();


      })
    }






    function getPageToken() {

      // SET FACEBOOK PAGE ID
      axios.get("https://graph.facebook.com/"+facebookpageid+"?fields=access_token&access_token="+longlivedtoken
      ).then( function (response) {
        pagetoken = response.data.access_token;
        
        //TODO add page functionality
        // isPage(facebook_pages, facebookpageid).then( function (result) {
        //   if (result) {
        //     // Update existing page with token
        //   } else {
        //     // Add page id and token
        //   }
        // } )


        updateLonglivedtoken();

      })
      .catch( function (err) {
        console.log(err.response.data, 'pagetoken')
        //res.send({error_name: 'Could not get pages api',err: err})
      })
    }

    




    function updateLonglivedtoken() {

      // UPDATE LONG LIVED TOKEN AND GET GRAPH DETAILS
      Facebook.findOneAndUpdate({facebook_email: facebook_email}, {$set:{'access_token': longlivedtoken}}, {new: true, useFindAndModify: false}, (err, doc) => {
          if (err) {
              console.log("Something wrong when updating data!");
          }


          getGraphData()


      });

    }
    




    function getGraphData() {

      axios.get("https://graph.facebook.com/v9.0/"+facebookpageid+"/insights/", {params: {
        access_token: pagetoken
      }}).then( function (response) {

        res.status(201).json(response.data);


      }).catch( function (err) {
        console.log(err.response.data, 'graph')
        res.status(201).json({error_name: "Could not get insights", err});
      })


      //ENDPOINTS REFERENCE
      //use since & until params
      /*
      Views - page_views_total
      Likes - page_fans
      Cta - page_total_actions
      Clicks - 
      */
    }


    



    async function isPage (pages, page_id) {
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].id == page_id) {
          return await Promise.resolve(true);
        }
        if (i == pages.length - 1){
          return await Promise.resolve(false);
        }
      }
    }
    



  } catch (err) {
    console.log(err);
    res.status(400).json({ err: err });
  }
};

exports.getPageDetails = async (req, res) => {

  try {


    var business_id = req.userData.business_id;
    var fbpageid = 'wemanagebusiness'; //GET THIS FROM DB 

    Facebook.findByCredential(business_id).then( facebook => {
      //Use page id to get page picture, cover and name
      axios.get("https://graph.facebook.com/v9.0/"+ fbpageid +"?fields=cover,name,picture", {params: {
        access_token: facebook.access_token,
      }}
      ).then( function (response) {

        res.status(201).json(response.data);

      })
      .catch( function (err) {
        console.log(err.response)
        res.send({error_name: 'Could not get page details',err: err.response.data.error})
      } )

      })


  } catch (err) {



  }

};