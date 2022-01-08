import { CloudFrontRequestEvent, Callback, Context } from "aws-lambda";

exports.handler = async (
  { Records }: CloudFrontRequestEvent,
  _: Context,
  callback: Callback
) => {
  const { request } = Records[0].cf;
  const { headers } = request;

  const user = "my-username";

  const password = "my-password";

  const authString =
    "Basic " + Buffer.from(user + ":" + password).toString("base64");

  if (
    typeof headers.authorization === "undefined" ||
    headers.authorization[0].value !== authString
  ) {
    const response = {
      status: "401",
      statusDescription: "Unauthorized",
      body: "Unauthorized",
      headers: {
        "www-authenticate": [{ key: "WWW-Authenticate", value: "Basic" }],
      },
    };

    callback(null, response);
  }

  callback(null, request);
};
