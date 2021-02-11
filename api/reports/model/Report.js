const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const reportSchema = mongoose.Schema({
  business_id: {
    type: String,
    required: true
  },
  page_id: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  social_media: {
    type: String,
    required: true
  },
  insight_type: {
    type: String,
    required: true
  },
  data_history: {
    type: Boolean,
    required: true
  },
  latest_date: {
    type: String,
    required: true
  },
  temp_reports: [{
    report_name: {
      type: String,
      required: [true, "Please Include A Report Name"]
    },
    report_conclusions: {
      type: String,
      required: [true, "Please Include The Report Conclusions"]
    },
    report_weeks: {
      type: String,
      required: [true, "Please Include The Reported Weeks"]
    }
  }],
  data_weeks: [{
    week_number: {
      type: String,
      required: [true, "Please Include The Week Number"]
    },
    since_until: {
      type: String,
      required: [true, "Please Include The Weeks since and until"]
    },
    total: {
      type: String,
      required: [true, "Please Include The Weeks Total"]
    },
    data: [{
      day: {
        type: String,
        required: [true, "Please Include Your Data's day"]
      },
      value: {
        type: String,
        required: [true, "Please Include A Value For Your Data"]
      },
      date: {
        type: String,
        required: [true, "Please Include Your Data's Specific Date"]
      }
    }]
  }],
  data_endpoint: {
    type: String,
    required: [true, "Please Include The Endpoint Used To Fetch These Insights"]
  }
  
}, {collection: 'reports'});


// reportSchema.pre("save", async function(next) {
//   // Hash the password before saving the Report model
//   const Report = this;
//   if (Report.isModified("password")) {
//     Report.password = await bcrypt.hash(Report.password, 8);
//   }
//   next();
// });

//this method search for a Report 
reportSchema.statics.findByCredentials = async (business_id, social_media, insight_type, page_id = null) => {
  //Page id is null because some social medias do not have seperate pages
  const report = await Report.findOne({ business_id, social_media, insight_type, page_id });
  console.log(report);

  if (!report) {
    throw new Error({ error: "Could not find the report being queried" });
  }

  return report;
};

//this method search for a Report by full_name and password.
reportSchema.statics.findMeta = async (r_id) => {
  const report = await Report.findById( r_id ).select('business_id page_id data_history data_endpoint social_media token insight_type latest_date');

  if (!report) {
    throw new Error({ error: "Could not find the report being queried" });
  }

  return report;
};

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
