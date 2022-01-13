// Here we deserialize a JSON structure from the Advisor API
// For a simple object like User, this feels unecessary since
// we are peforming an isophormic transformation
// However, it is good practice to provide this layer in case the FE
// wants to make transformations on the API returned data
// Deserializations that perform a simple map do not need to be unit tested
function deSerializeUser(data) {
  return {
    id: data.id,
    email: data.email,
    enable: data.enable,
    role: data.role,
    userId: data.userId,
  };
}

module.exports = {
  deSerializeUser,
};
