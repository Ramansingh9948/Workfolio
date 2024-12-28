const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const User = require('./models/User');
const Contact = require('./models/Contact');
require('./config/passport')(passport);
const app = express();


require('dotenv').config();  // Load environment variables



// Use the URI from the environment variable, or fallback to a local MongoDB connection
const dbURI = process.env.ATLASDB_URI;

mongoose.connect(dbURI, {
    connectTimeoutMS: 10000,  // Connection timeout
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch((err) => console.error('Failed to connect to MongoDB:', err));



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Setup view engine
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
// Express session
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


// Middleware to make flash messages available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});


// middleware for authentication wheather user exist or not 
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // Proceed if the user is authenticated
  }
  res.redirect('/login'); // Redirect to login if not authenticated
};










app.get("/", (req, res) => {
  res.render('webpages/home', { title: 'Home Page' });
})

app.get("/signup", (req, res) => {
  res.render("webpages/signup.ejs");
})
app.get("/login", (req, res) => {
  res.render("webpages/login.ejs");
})
app.get("/about", (req, res) => {
  res.render("webpages/aboutUs.ejs");
})
app.get("/privacy", (req, res) => {
  res.render("webpages/privacy.ejs");
})
app.get("/contact", (req, res) => {
  res.render("webpages/contact.ejs");
})
app.get("/dashboard", isAuthenticated, async (req, res) => {
  // let id = req.params.id;
  // const user = await User.findById(id);
  // if(!user) res.status(404).send('User not found');
  try {
    console.log(req.user);
    res.render("webpages/user-dashboard.ejs", { user: req.user });
  } catch (err) {
    console.log('Error while fetching the user', err);
    res.status(500).send('Server error');
  }

})
app.get("/update-profile", isAuthenticated, async (req, res) => {
  try {
    // Ensure `req.user` contains the user object
    if (!req.user) {
      return res.status(404).send("User not found");
    }
    res.render("webpages/update-profile.ejs", { user: req.user });
  } catch (err) {
    console.log("Error while fetching the user", err);
    res.status(500).send("Server error");
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { fullname, username, email, password, usertype } = req.body;

  // Input validation (basic example)
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the email is already in use
    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    // Create a new user with password hashing handled by passport-local-mongoose
    const newUser = new User({ fullname, username, email, usertype }); // Include username
    console.log(newUser);

    User.register(newUser, password, (err, user) => {
      if (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({ message: 'Error creating user' });
      }
      res.status(201).json({ message: 'User  created successfully', user });
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Post Login Route
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log("User not found");
      return res.redirect('/login'); // Redirect if login fails
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect to dashboard with a success flag
      res.redirect('/dashboard');
    });
  })(req, res, next);
});


// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});
//Rendering the Add Skill Form
app.get("/addskill", isAuthenticated, async (req, res) => {

  try {
    console.log(req.user);
    res.render("webpages/addSkill.ejs", { user: req.user });
  } catch (err) {
    console.log('Error while fetching the user', err);
    res.status(500).send('Server error');
  }

})
//Adding skills 
// Adding skills
// Adding skills
app.post('/add-skill', async (req, res) => {
  let { skill } = req.body; // Extract the skill from the request body

  if (!skill) {
    return res.status(400).send('Skill cannot be empty.');
  }

  // Normalize and trim whitespace for each skill
  const skillArray = skill
    .split(',') // Split by commas
    .map((s) => s.trim().replace(/\s+/g, ' ')) // Trim and reduce multiple spaces to one
    .filter((s) => s.length > 0); // Remove empty strings

  if (skillArray.length === 0) {
    return res.status(400).send('No valid skills provided.');
  }

  try {
    // Update the logged-in user's skills array
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { skills: { $each: skillArray } } }, // Add each skill, avoiding duplicates
      { new: true }
    );

    res.redirect('/dashboard'); // Redirect back to the dashboard
  } catch (err) {
    console.error('Error adding skills:', err);
    res.status(500).send('Server error while adding skills.');
  }
});

//Rendering the Project From
app.get("/addProject", isAuthenticated, async (req, res) => {
  try {
    console.log(req.user);
    res.render("webpages/addProjects.ejs", { user: req.user });
  } catch (err) {
    console.log('Error while fetching the user', err);
    res.status(500).send('Server error');
  }
})
// Route to get all users
app.get('/users', async (req, res) => {
  try {
      const users = await User.find();  // Fetch all users from MongoDB
      res.json(users);  // Send the users as JSON response
  } catch (err) {
      res.status(500).json({ message: 'Error fetching users' });
  }
});
//   Adding the Projects 
app.post('/add-project', async (req, res) => {
  const { title, description, link } = req.body;

  if (!title) {
    return res.status(400).send('Project title is required.');
  }

  const newProject = { title, description, link };

  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { projects: newProject } }, // Add the project to the array
      { new: true }
    );

    res.redirect('/dashboard'); // Redirect back to the dashboard
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).send('Server error while adding project.');
  }
});

//Removing the projects

app.post('/remove-project', async (req, res) => {
  const { title } = req.body;

  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { projects: { title } } }, // Remove the project by title
      { new: true }
    );

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error removing project:', err);
    res.status(500).send('Server error while removing project.');
  }
});


// POST route to save contact form data
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    // Create a new contact document
    const newContact = new Contact({
      name,
      email,
      message
    });
    console.log(newContact);
    // Save the document to MongoDB
    await newContact.save();

    // Send a response back to the client
    res.status(200).send('Your message has been received!');
  }
  catch (err) {
    console.error(err);
    res.status(500).send('Error in submitting your message. Please try again later.');
  }
});

app.get('/check-username', async (req, res) => {
  const { username } = req.query;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ available: false }); // Username is taken
    }
    res.json({ available: true }); // Username is available
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error checking username' });
  }
});
//update-profile
app.get('/search', async (req, res) => {
  const { query } = req.query; // Extract search query from the URL parameters

  try {
    if (!query) {
      // If no query is provided, render the search page
      return res.render('webpages/search');
    }

    // Search by name (case-insensitive partial match)
    const users = await User.find({
      fullname: new RegExp(query, 'i'), // Case-insensitive regex search on `name`
    }).select('name username'); // Only return name and username

    // Render the search results
    res.render('webpages/search-result', { users, query });
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).send('Server error.');
  }
});


app.get('/user/:username', async (req, res) => {
  try {
      const user = await User.findOne({ username: req.params.username })
          .populate('followers')
          .populate('following');
      const currentUser = req.user;

      if (!user) {
          return res.status(404).send("User not found");
      }

      res.render('webpages/profile', { user, currentUser });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});

// Follow Route
app.post('/follow', async (req, res) => {
    const { userId, targetUserId } = req.body;

    try {
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        // Ensure user is not following themselves
        if (userId === targetUserId) {
            return res.status(400).send("You cannot follow yourself.");
        }

        // Add target user to user's following list
        if (!user.following.includes(targetUserId)) {
            user.following.push(targetUserId);
            await user.save();

            // Add user to target user's followers list
            targetUser.followers.push(userId);
            await targetUser.save();

            return res.status(200).send("Followed successfully.");
        } else {
            return res.status(400).send("Already following this user.");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while following the user.");
    }
});


// Unfollow Route
app.post('/unfollow', async (req, res) => {
    const { userId, targetUserId } = req.body;

    try {
        const user = await User.findById(userId);
        const targetUser = await User.findById(targetUserId);

        // Remove target user from user's following list
        user.following = user.following.filter(id => id.toString() !== targetUserId);
        await user.save();

        // Remove user from target user's followers list
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
        await targetUser.save();

        return res.status(200).send("Unfollowed successfully.");
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while unfollowing the user.");
    }
});




app.get("/*", (req, res) =>{
  res.render("webpages/error");
})
app.listen(3001, () => console.log('Server running on port 3001'));
