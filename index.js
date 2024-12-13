const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require('mysql2'); 
const session = require('express-session');
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const app = express();
const PORT = 3500

//load enviromental variables
dotenv.config();
//middlewares
app.use(express.json());
app.use(cors());
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false, // Set to true if using HTTPS
    httpOnly: true, // Prevent JavaScript access to the session cookie
  }
}));

function checkAuth(req,res,next){
  if(!req.session.user){
    res.redirect("/client-login")
  }else{
    next()
  }
}
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.user_id = decoded.user_id; // Store the user_id in the request object
    next();
  });
};

//set view engine
app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));

//server static files
app.use(express.static(path.join(__dirname,"public")));

//connect to db

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Rkamaa@54',
    database: 'beauty_spa'
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('Connected to the database');
    }
  });

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email address from environment variables
      pass: process.env.EMAIL_PASS, // Your email password from environment variables
    },
  });
  
  // Function to send verification email
  function sendVerificationEmail(userEmail, userId, token) {
    // Generate verification URL
    const verificationUrl = `http://192.168.100.130:3500/verify-email?token=${token}`;
  
    // Email options
    const mailOptions = {
        from: process.env.EMAIL_FROM,  // Sender email address
        to: userEmail,                // Recipient email address
        subject: 'Email Verification',
        html: `
          <html>
  <head>
    <style>
      /* Tailwind CSS integration for email compatibility */
      @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.1.2/dist/tailwind.min.css');

      /* Additional custom styles for email responsiveness */
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f7f7f7;
      }

      /* Styling for the main container */
      .email-container {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        padding: 20px;
      }

      /* Style for headings */
      .heading {
        color: #1a202c;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
      }

      /* Style for the button */
      .button {
        background-color: #3182ce;
        color: #ffffff;
        font-size: 16px;
        padding: 12px 30px;
        border-radius: 30px;
        text-decoration: none;
        transition: background-color 0.3s ease, transform 0.3s ease;
      }

      /* Hover effects for the button */
      .button:hover {
        background-color: #2b6cb0;
        transform: scale(1.05);
      }

      /* Style for footer and additional information */
      .footer {
        font-size: 12px;
        color: #b0b0b0;
        text-align: center;
        margin-top: 20px;
      }

      .info-text {
        color: #2d3748;
        font-size: 14px;
        text-align: center;
        margin-top: 20px;
      }

      .logo-container {
        text-align: center;
        margin-bottom: 20px;
      }

      /* Responsive design for smaller screens */
      @media (max-width: 600px) {
        .email-container {
          padding: 15px;
        }
        .heading {
          font-size: 20px;
        }
        .button {
          padding: 10px 25px;
        }
      }
    </style>
  </head>

  <body class="bg-gray-100 p-6">
    <div class="email-container max-w-2xl mx-auto">
      <!-- Logo Section -->
      <div class="logo-container">
        <img src="" alt="Your Company Logo" width="150" />
      </div>

      <h1 class="heading text-blue-600">Email Verification</h1>
      <p class="text-lg text-gray-700 text-center mt-4">Hello!</p>
      <p class="text-md text-gray-600 text-center mt-2">Thank you for signing up with us. Please click the button below to verify your email address:</p>
      
      <div class="mt-6 text-center">
        <a href="${verificationUrl}" class="button">
          Verify Your Email
        </a>
      </div>
      
      <p class="text-md text-gray-600 text-center mt-6">
        If you did not request this email, please ignore it.
      </p>

      <!-- Additional Information Section -->
      <div class="info-text">
        <p>If you need any help, feel free to <a href="mailto:support@yourcompany.com" class="text-blue-600">contact our support team</a>.</p>
        <p>We’re here to help!</p>
      </div>

      <!-- Footer Section -->
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        <p>If you have any questions, feel free to visit our <a href="https://www.yourcompany.com" class="text-blue-600">website</a> or contact support.</p>
      </div>
    </div>
  </body>
</html>

        `
      };
      
      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending verification email:', error);
        } else {
          console.log('Verification email sent:', info.response);
        }
      });
    }      
//serve routes
app.get("/", checkAuth,(req, res) => {
    res.render("home");
});
  
app.get("/services",checkAuth, (req, res) => {
    const query = "SELECT * FROM services";
    db.query(query, async(err, results) => {
        if (err) {
            res.status(500).json({ message: "An error occurred while retrieving data" });
        } else {
            res.render("services", { results});
        }
    });

});
  
app.get("/payment", checkAuth,(req, res) => {

    res.render("payment");  // Pass total to the view
});



app.get("/bookings",checkAuth,(req,res)=>{
    res.render("bookings");
})
// Route to fetch notifications for the authenticated user
app.get('/notifications', checkAuth,async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

 

  try {
    const [notifications] = await db.promise().query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.render('notifications', { notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.post('/notifications/mark-read/:id', async (req, res) => {
  const { id } = req.params;
  
  // Fetch userId from session
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Update the notification to mark it as read
    const [result] = await db.promise().query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/notifications/mark-all-read', async (req, res) => {
  // Fetch userId from session
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Update all notifications to mark them as read
    const [result] = await db.promise().query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No notifications to mark as read' });
    }

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

function ckeckEmployeeAuth(req,res,next){
  if(!req.session.user){

  }
}

app.get("/employee",isAuthenticated,(req,res)=>{
    res.render("employee");
})
app.get("/employee-login",(req,res)=>{
    res.render("login");
})
app.get("/contact",(req,res)=>{
    res.render("contact");
})
app.get("/client-login",(req,res)=>{
  res.render("client-login");
})
app.get("/client-signup",(req,res)=>{
  res.render("client-signup");
})
app.get('/appointments', (req, res) => {
  // Access the userId from the session using optional chaining
  const userId = req.session.user?.id;

  // Check if the user is logged in
  if (!userId) {
    return res.redirect("/client-login")
  }

  // Fetch upcoming appointments based on the user ID
  db.query('SELECT * FROM appointments WHERE status = "Pending" AND user_id = ?', [userId], (err, upcomingAppointments) => {
    if (err) {
      console.error('Error fetching upcoming appointments:', err);
      res.status(500).send('Database error');
      return;
    }

    // Fetch completed appointments based on the user ID
    db.query('SELECT * FROM appointments WHERE status = "Completed" AND user_id = ?', [userId], (err, completedAppointments) => {
      if (err) {
        console.error('Error fetching completed appointments:', err);
        res.status(500).send('Database error');
        return;
      }
      

      // Render the EJS template with the fetched data
      res.render('appointments', {
        upcomingAppointments,
        completedAppointments,
        appointmentsPerPage: 2,
        currentPage: 1,
      });
    });
  });
});



app.get("/employee-signup",(req,res)=>{
    res.render("employee-signup");
})
app.get("/employee-profile",isAuthenticated,(req,res)=>{
    res.render("employee-profile");
})

app.get("/verify-email",(req,res)=>{
    const token = req.query.token;
    if(!token){
        res.status(400).json({message:"Token is missing"})
    }else{
        jwt.verify(token,process.env.JWT_SECRET,async(err,decode)=>{
            if(err){
                res.status(400).json({message:"invalid or expired token"})
            }else{
               try{
                    const query ="UPDATE employees SET is_verified = true WHERE verification_token = ?"
                    db.query(query,[token],async(err,results)=>{
                        if(err || results.affectedRows === 0){
                            res.status(400).json({message:"error verifying email"})
                        }else{
                            res.redirect("/employee-login")
                        }
                    })

               }catch(error){
                  res.status(500).json({message:"Internal server error"})
               }

            }
        })
    }

})
//booking appointment
// API endpoint to book an appointment
// Define the route to handle the POST request

app.use(bodyParser.json());

// Booking endpoint
app.post("/api/booking", async (req, res) => {
  const { name, email, phone, price, serviceId, date, time } = req.body;
  console.log({ name, email, phone, price, serviceId, date, time });

  // Convert price to a float for calculation
  const deposit = parseFloat(price) * 0.5;  // Calculate deposit as 50% of the total price
  const formattedDeposit = deposit.toFixed(2);  // Format to 2 decimal places

  // Step 1: Get user_id from session (assuming user is logged in and session is established)
   // Fetch userId from session
   const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  // Step 2: SQL query to save the appointment
  const appointmentQuery = "INSERT INTO appointments (name, email, phone, service_id, date, time, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(appointmentQuery, [name, email, phone, serviceId, date, time, userId], (err, results) => {
    if (err) {
      console.error('Error saving appointment:', err);
      return res.status(500).json({ message: 'Failed to save appointment' });
    }

    // Step 3: Prepare the notification message
    const notificationMessage = `Your booking for service ${serviceId} on ${date} at ${time} has been confirmed.`;

    // Step 4: SQL query to save the notification for the user
    const notificationQuery = "INSERT INTO notifications (user_id, message) VALUES (?, ?)";
    
    db.query(notificationQuery, [userId, notificationMessage], (notificationErr) => {
      if (notificationErr) {
        console.error("Error saving notification:", notificationErr);
        return res.status(500).json({ message: "Booking confirmed, but notification failed" });
      }

      // Step 5: Send response with appointment ID and deposit value
      res.status(200).json({
        message: 'Appointment created successfully, please proceed to payment',
        appointmentId: results.insertId,
        deposit: formattedDeposit  // Include formatted deposit value
      });
    });
  });
});
app.get("/api/notifications/unread", (req, res) => {
  // Fetch userId from session
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const query = "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE";

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching unread notifications:", err);
      return res.status(500).json({ message: "Failed to retrieve unread count" });
    }

    res.status(200).json({ unreadCount: results[0].unreadCount });
  });
});


//signup api
app.post("/api/signup", async (req, res) => {
    const { fullname, email, password } = req.body;

    // Check if user already exists
    const [rows] = await db.promise().execute("SELECT * FROM employees WHERE email = ?", [email]);


    if (rows.length > 0) {
        return res.status(400).json({ message: "User with this email already exists" });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({email},process.env.JWT_SECRET,{expiresIn:'1h'})

        // Check if password hashing was successful
        if (!hashedPassword) {
            return res.status(400).json({ message: "Password hashing failed" });
        }

        // Insert new employee into the database
        const query = "INSERT INTO employees (fullname, email, password,verification_token) VALUES (?, ?, ?,?)";
        db.query(query, [fullname, email, hashedPassword,verificationToken], (error, results) => {
            if (error) {
                console.error("Error inserting user:", error);
                return res.status(500).json({ message: "Error during registration" });
            }else{

                sendVerificationEmail(email,results.insertId,verificationToken)
                res.status(201).json({ message: "Registered successfully check your email for verication" });

            }
        });

    } catch (error) {
        console.error("Error during password hashing:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/client-signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  // Check if user already exists
  const [rows] = await db.promise().execute("SELECT * FROM users WHERE email = ?", [email]);


  if (rows.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
  }

  try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);


      // Check if password hashing was successful
      if (!hashedPassword) {
          return res.status(400).json({ message: "Password hashing failed" });
      }

      // Insert new employee into the database
      const query = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
      db.query(query, [fullname, email, hashedPassword], (error, results) => {
          if (error) {
              console.error("Error inserting user:", error);
              return res.status(500).json({ message: "Error during registration" });
          }else{
              res.status(201).json({ message: "Registered successfully" });

          }
      });

  } catch (error) {
      console.error("Error during password hashing:", error);
      return res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/api/client-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query the database for the user
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    // Verify the password (if hashed)
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Store user data in session
    req.session.user = { id: user.id, email: user.email };

    res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// Login Endpoint
app.post('/api/employee-login', (req, res) => {
  const { email, password } = req.body;

  // Query to check if the employee exists
  db.query('SELECT * FROM employees WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(400).send('Invalid email or password');

    const employee = results[0];

    // Compare the hashed password
    bcrypt.compare(password, employee.password, (err, match) => {
      if (err) return res.status(500).send('Error checking password');
      if (!match) return res.status(400).send('Invalid email or password');

      // Session creation
      req.session.employeeId = employee.id;  // Store employee ID in session
      req.session.email = employee.email;
      
      res.status(200).send('Login successful');
    });
  });
});
// Middleware to check if employee is logged in
function isAuthenticated(req, res, next) {
  if (req.session.employeeId) {
    return next();
  } else {
    res.redirect("/employee-login")
  }
}
// POST route for canceling an appointment
app.post('/appointments/cancel/:id', (req, res) => {
  const appointmentId = req.params.id;
  const userId = req.session.user?.id;  // Get the userId from the session

  // Check if the user is logged in
  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  // SQL query to update the appointment status to 'canceled'
  const query = 'UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?';
  db.query(query, ['cancelled', appointmentId, userId], (err, result) => {
    if (err) {
      console.error('Error canceling appointment:', err);
      return res.status(500).json({ success: false, message: 'Failed to cancel the appointment' });
    }
    
    // Check if any rows were affected (appointment exists and was updated)
    if (result.affectedRows > 0) {
      // Generate a notification message
      const notificationMessage = 'Your appointment has been successfully canceled.';

      // SQL query to save the notification for the user
      const notificationQuery = "INSERT INTO notifications (user_id, message) VALUES (?, ?)";

      db.query(notificationQuery, [userId, notificationMessage], (notificationErr) => {
        if (notificationErr) {
          console.error("Error saving notification:", notificationErr);
          // Continue rendering even if notification fails
        }

        // Return the response confirming the cancellation
        return res.json({ success: true, message: 'Appointment successfully canceled' });
      });
    } else {
      return res.status(404).json({ success: false, message: 'Appointment not found or you do not have permission to cancel this appointment' });
    }
  });
});


app.listen(3500,"0.0.0.0",()=>{
  console.log("server running on port,http://0.0.0.0:3500");
});


