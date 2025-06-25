const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Check if user already exists with googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If not found by googleId, check if email exists (manual registration)
          user = await User.findOne({ email });

          if (user) {
            // Link Google ID to existing account
            user.googleId = profile.id;
            await user.save();
          } else {
            // Create new user
            const [firstname, ...rest] = profile.displayName.split(' ');
            const lastname = rest.join(' ') || ' ';

            user = await User.create({
              firstname: firstname || 'Google',
              lastname: lastname || 'User',
              email,
              googleId: profile.id,
              role: 'user',
              emailVerified: true,
              isActive: true,
              createdAt: new Date(),
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Google auth error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
