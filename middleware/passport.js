// config/passport.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../Models/user");

console.log("✅ GoogleStrategy registered");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("✅ GoogleStrategy triggered");

      try {
        if (!profile) {
          console.error("❌ No profile received from Google");
          return done(new Error("No profile received"), null);
        }

        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error("❌ Email not found in Google profile:", profile);
          return done(new Error("No email found in Google profile"), null);
        }

        console.log("📧 Google email:", email);
        console.log("🆔 Google ID:", profile.id);

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          console.log("🔍 No user with googleId. Checking by email...");
          user = await User.findOne({ email });

          if (user) {
            console.log("🔗 Linking existing user with Google ID...");
            user.googleId = profile.id;
            await user.save();
          } else {
            console.log("🆕 Creating new user from Google profile...");
            user = await User.create({
              firstname: profile.name?.givenName || "Google",
              lastname: profile.name?.familyName || "User",
              email,
              googleId: profile.id,
              role: "user",
              emailVerified: true,
              isActive: true,
              createdAt: new Date(),
            });
          }
        } else {
          console.log("✅ Existing user found by googleId.");
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Error inside GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);
