const form = document.getElementById("registration-form");

form.addEventListener("submit", async function(event) {
  event.preventDefault(); // Prevent form submission

  const email = document.getElementById("email").value;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;  // Regular expression for email validation

if (!emailPattern.test(email)) {
  showErrorModal();  // Show error modal if the email is invalid
  return; // Prevent Axios request if email validation fails
}

  // Collect form data using FormData
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries()); // Converts FormData to an object
  console.log("Form data:", data); // Logs the form data for debugging
  
  try {
    // Axios POST request
    const response = await axios.post("http://localhost:3500/api/signup", {
      fullname: data.fullname,
      email: data.email,
      password: data.password,
    });

    // Response handling
    if (response.status === 201) {
      console.log("Data submitted successfully:", response.data);
      showSuccessModal(); // Show the success modal
    } else {
      console.error("Unexpected response status:", response.status);
      alert("Something went wrong. Please try again later.");
    }
  } catch (error) {
    // Enhanced error handling
    console.error("Error occurred:", error.response ? error.response.data : error.message);
    alert("Error occurred while processing your request.");
  }
});

// Function to show the success modal
function showSuccessModal() {
  const successModal = document.getElementById("successModal");
  successModal.classList.remove("hidden"); // Show modal
  setTimeout(()=>{
    successModal.classList.add("hidden"); // Hide modal after 3 seconds
  },5000)

  // Handle redirect to login page when the button is clicked
//   const proceedButton = document.getElementById("proceedButton");
//   proceedButton.addEventListener("click", function() {
//     window.location.href = "/employee-login"; // Redirect to login page
//   });
}

// Function to show the error modal
function showErrorModal() {
  const errorModal = document.getElementById("errorModal");
  errorModal.classList.remove("hidden"); // Show error modal

  // Handle closing the error modal
  const closeErrorButton = document.getElementById("closeErrorButton");
  closeErrorButton.addEventListener("click", function() {
    errorModal.classList.add("hidden"); // Close the error modal
  });
}

  document.getElementById("menu-button").addEventListener("click", function() {
    const menu = document.getElementById("mobile-menu");
    menu.classList.toggle("hidden");
  });


  