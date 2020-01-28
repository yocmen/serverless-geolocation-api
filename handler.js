"use strict";
const maxmind = require("maxmind");

module.exports.fetchLocationData = async event => {
  if (event.source === "serverless-plugin-warmup") {
    console.log("WarmUP - Lambda is warm!");
    return Promise.resolve("Lambda is warm!");
  }

  let cityLookup, countryLookup;

  [cityLookup, countryLookup] = await Promise.all([
	maxmind.open("./GeoLite2-City.mmdb"),
	maxmind.open("./GeoLite2-Country.mmdb")
  ]);

  let ip;

  ip = event.requestContext.identity.sourceIp;

  if (event.headers && event.headers["X-Forwarded-For"]) {
    ip = event.headers["X-Forwarded-For"].split(",")[0];
  }

  let cityData, countryData;

  try {
    [cityData, countryData] = await Promise.all([
      cityLookup.get(ip),
      countryLookup.get(ip)
    ]);
  } catch (e) {
    console.log("Lookup failed!", e);
    const response = {
      statusCode: 500,

      body: JSON.stringify({
        success: false,
        error: e
      })
    };
    return Promise.resolve(response);
  }

  const response = {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      ip: ip,
      city: cityData,
      country: countryData
    })
  };

  return Promise.resolve(response);
};
