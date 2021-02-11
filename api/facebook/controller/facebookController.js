const Facebook = require("../model/Facebook");
const axios = require("axios");


// GETNEWSTATS ROUTE



exports.getNewStats = async (req, res) => {
  try {

    var business_id = req.body.business;
    var facebookpageid = 'wemanagebusiness'; //GET THIS FROM DB
    var longlivedtoken;
    var pagetoken;


    Facebook.returnToken(business_id).then( function  (token) {

      longlivedtoken = token.user;
      pagetoken = token.page;

      getGraphData()

    })

    function getGraphData() {

      //TODO: SETUP THE DATE VARIABLR

      axios.get("https://graph.facebook.com/v9.0/"+facebookpageid+"/insights?metric=page_views_total,page_fan_adds_unique,page_total_actions,page_engaged_users&since=2020-11-00&period=day", {params: {
        access_token: pagetoken
      }}).then( function (response) {
        res.status(201).json(response.data);


      }).catch( function (err) {
        console.log(err.response.data, 'graph')
        res.status(401).json({error_name: "Could not get insights", err});
      })


      //ENDPOINTS REFERENCE
      //use since & until params
      /*
      Views - page_views_total
      Likes - page_fan_adds_unique
      Cta - page_total_actions
      Engagement - page_engaged_users
      */
    }

  } catch (err) {
    console.log(err);
    res.status(400).json({ err: err });
  }
};



// GETPAGEDETAILS ROUTE



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

    res.send({error_name: 'Could not get page details',err: err.response.data.error})

  }

};



// GETPAGEPOSTS ROUTE



exports.getPagePosts = async (req, res) => {

  try {

    var business_id = req.userData.business_id;
    var fbpageid = 'wemanagebusiness'; //GET THIS FROM DB
    // Call the /{page-id}/posts endpoints for posts 
    Facebook.findByCredential(business_id).then( facebook => {

      axios.get("https://graph.facebook.com/v9.0/"+ fbpageid +"/posts?fields=full_picture,message,created_time&since=2020-11-00", {params: {
        access_token: facebook.access_token,
      }}).then( function (response) {
        res.status(201).json(response.data);


      }).catch( function (err) {
        console.log(err.response.data, 'posts')
        res.status(401).json({error_name: "Could not get posts", err});
      })

    })

  } catch (err) {
    console.log(err)
    res.status(400).send({err: err.data})
  }

};



// GET USER PAGES



exports.getPages = async (req, res) => {

  try {

    var business_id = req.userData.business_id;
    // Call the /{page-id}/posts endpoints for posts 
    Facebook.findByCredential(business_id).then( facebook => {

      console.log(facebook.pages, 'pages available')

      // Add only pages that the account has access to.

      // Amount of pages attached to account

      var pages_avail = facebook.pages.length;

      // Create a recursive function which gets page details for all available facebook pages

      var i = 0;

      var isErrors = false;
      var failedPages = [];

      singlePageDetails();

      function singlePageDetails (completedPages = []) {
        console.log(facebook.pages[i]);
        axios.get("https://graph.facebook.com/v9.0/"+ facebook.pages[i].id +"?fields=cover,picture", {params: {
          access_token: facebook.access_token,
        }}).then( function (response) {

          completedPages.push(response.data);

          handleIteration(completedPages)

        }).catch( function (err) {

          isErrors = true;
          failedPages.push(facebook.pages[i])

          console.log(facebook.pages[i], 'failed page', err.response.data)

          handleIteration(completedPages, isErrors, failedPages)
          
        })


        function handleIteration (completedPages, isErrors = false, failedPages = []) {

          if ( i == pages_avail-1) {
            if (isErrors) {
              res.status(302).json({msg: "Some errors with pages", failedPages});
            } else {
              res.status(201).json(completedPages);
            }
          } else {

            i++
            singlePageDetails(completedPages);
          }

        }

      }
    })

  } catch (err) {
    console.log(err)
    res.status(400).send({err: err.data})
  }

}