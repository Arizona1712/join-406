/**
 * Base URL for the Firebase database.
 * @constant {string}
 */
const BASE_URL = "https://join-gruppenarbeit-137ed-default-rtdb.europe-west1.firebasedatabase.app/";


/**
 * Generates a random color from predefined CSS variables.
 * 
 * This function selects a random CSS variable from a list of color variables,
 * retrieves its value from the computed styles, and returns the corresponding color as a string.
 * 
 * @returns {string} The randomly selected color value (e.g., `"#FF7A00"`).
 */
function getRandomColor() {
    const colorVars = [
        '--contact-color-orange',
        '--contact-color-pink',
        '--contact-color-lavender',
        '--contact-color-violet',
        '--contact-color-aqua',
        '--contact-color-tropical',
        '--contact-color-coral',
        '--contact-color-peach',
        '--contact-color-magenta',
        '--contact-color-gold',
        '--contact-color-blue',
        '--contact-color-lime',
        '--contact-color-purple',
        '--contact-color-crimson',
        '--contact-color-honey'
    ];

    // Access CSS variable values from the root element
    const rootStyles = getComputedStyle(document.documentElement);

    // Pick a random variable from the list
    const randomVar = colorVars[Math.floor(Math.random() * colorVars.length)];

    // Return the corresponding color value
    return rootStyles.getPropertyValue(randomVar).trim();
}

/**
 * Assigns a random color to a guest user.
 * 
 * This function uses `getRandomColor` to fetch a random color and logs the assigned color to the console.
 * 
 * @returns {string} The assigned color value for the guest user.
 */
function assignGuestColor() {
    // Get a random color
    let color = getRandomColor();

    // Log the assigned color
    console.log('Assigned color:', color);

    // Return the color
    return color;
}

/**
 * Fügt einen neuen Benutzer in die Datenbank ein, nachdem die Eingabefelder validiert wurden.
 * Löscht ungültige Daten und leitet im Erfolgsfall weiter.
 * @async
 */
async function addUser() {
    let color = getRandomColor();  
    let email = document.getElementById("email");
    let password = document.getElementById("password");
    let confirmPassword = document.getElementById("confirmPassword");
    let userName = document.getElementById("user");
    let privacyPolicy = document.getElementById("privacyPolicy");

    checkEmailExisting(email);

    const isPasswordValid = await checkPassword(password, confirmPassword);
    const isNameValid = await checkName(userName);
    const isEmailValid = await checkEmail(email);
    const isPrivacyPolicyChecked = await checkPrivacyPolicy(privacyPolicy.checked);
    const mailAlreadyExists = await checkEmailExisting(email);

    if (!isPasswordValid || !isNameValid || !isEmailValid || !isPrivacyPolicyChecked || mailAlreadyExists) {
        clearData(password, confirmPassword);
        return;
    }

    let singleLogInData = {
        "email": email.value,
        "password": password.value,
        "name": userName.value,
        "color": color
    };

    await addToContacts(email, userName, color);
    await updateUser(singleLogInData);
}

/**
 * Adds a new user to the contacts list in the database.
 * Creates a new contact record with the provided email and user name.
 * 
 * @async
 * @function addToContacts
 * @param {HTMLInputElement} email - The email input element of the contact.
 * @param {HTMLInputElement} userName - The user name input element of the contact.
 * 
 * @returns {Promise<void>} Resolves when the contact has been added successfully.
 */
async function addToContacts(email, userName, color) {
    let registerData = {
        "mail": email.value,
        "name": userName.value,
        "color": color
    };
    await updateContacts(registerData);
}

/**
 * Clears all user data from the form.
 */
function clearAllUserData() {
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("user").value = "";
    document.getElementById('privacyPolicy').checked = false;
}

/**
 * Checks if the given email already exists in the database.
 * @async
 * @param {HTMLInputElement} email - The email input element.
 * @returns {Promise<boolean>} True if email exists, otherwise false.
 */
async function checkEmailExisting(email) {
    email = email.value;
    const path = "users";
    const queryUrl = `${BASE_URL}${path}.json?orderBy=%22email%22&equalTo=%22${email}%22`;

    try {
        const response = await fetch(queryUrl);
        if (!response.ok) {
            console.error("HTTP Error:", response.status, response.statusText);
            return false;
        }
        const result = await response.json();
        if (Object.keys(result).length > 0) {
            errorFunctionEmailExist();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error:", error);
        return false;
    }
}

/**
 * Validates the user's name.
 * @param {HTMLInputElement} userName - The user name input element.
 * @returns {Promise<boolean>} True if name is valid, otherwise false.
 */
async function checkName(userName) {
    if (/\d/.test(userName.value) || userName.value.trim() === "") {
        errorFunctionName();
        return false;
    } else {
        document.getElementById('user').style.border = "1px solid lightgray";
        document.getElementById('errorMessageName').innerHTML = "";
        return true;
    }
}

/**
 * Displays an error for invalid user name.
 */
function errorFunctionName() {
    document.getElementById('errorMessageName').innerHTML = /*html*/`
     <div class="errorText">Your name cannot contain numbers or is blank.</div>`;
    document.getElementById('user').style.border = "1px solid red";
}

/**
 * Validates the password and its confirmation.
 * @param {HTMLInputElement} password - The password input element.
 * @param {HTMLInputElement} confirmPassword - The confirm password input element.
 * @returns {boolean} True if passwords are valid and match, otherwise false.
 */
function checkPassword(password, confirmPassword) {
    if (password.value !== confirmPassword.value ||
        password.value.trim() === "" ||
        password.value.length < 8 ||
        password.value.length > 20) {
        errorFunctionPassword();
        return false;
    } else {
        document.getElementById('confirmPassword').style.border = "1px solid lightgray";
        document.getElementById('password').style.border = "1px solid lightgray";
        document.getElementById('errorMessageConfirmPassword').innerHTML = "";
        return true;
    }
}

/**
 * Displays an error for invalid or mismatched passwords.
 */
function errorFunctionPassword() {
    const errorMessage = '<div class="errorText">Your passwords must match and be 8–20 characters.</div>';
    document.getElementById('errorMessageConfirmPassword').innerHTML = errorMessage;
    document.getElementById('errorMessagePassword').innerHTML = errorMessage;

    document.getElementById('confirmPassword').style.border = "1px solid red";
    document.getElementById('password').style.border = "1px solid red";
}

/**
 * Validates the email format.
 * @param {HTMLInputElement} email - The email input element.
 * @returns {Promise<boolean>} True if email is valid, otherwise false.
 */
async function checkEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value) || email.value.trim() === "") {
        errorFunctionEmail();
        return false;
    } else {
        document.getElementById('email').style.border = "1px solid lightgray";
        document.getElementById('errorMessageEmail').innerHTML = "";
        return true;
    }
}

/**
 * Displays an error for invalid email format.
 */
function errorFunctionEmail() {
    document.getElementById('errorMessageEmail').innerHTML = /*html*/`
    <div class="errorText">please enter a valid email address</div>`;
    document.getElementById('email').style.border = "1px solid red";
}

/**
 * Displays an error if the email already exists.
 */
function errorFunctionEmailExist() {
    document.getElementById('errorMessageEmail').innerHTML = /*html*/`
    <div class="errorText">This email address is already taken</div>`;
    document.getElementById('email').style.border = "1px solid red";
}

/**
 * Checks if the privacy policy checkbox is checked.
 * @param {boolean} isChecked - The state of the privacy policy checkbox.
 * @returns {boolean} True if checked, otherwise false.
 */
async function checkPrivacyPolicy(isChecked) {
    if (isChecked) {
        document.getElementById('privacyPolicy').style.outline = "";
        document.getElementById('errorMessageprivacyPolicy').innerHTML = "";
        return true;
    } else {
        document.getElementById('errorMessageprivacyPolicy').innerHTML = /*html*/`
        <div class="errorText">please check the privacy policy</div>`;
        document.getElementById('privacyPolicy').style.outline = "2px solid red";
        return false;
    }
}

/**
 * Clears the password and confirm password fields.
 * @param {HTMLInputElement} password - The password input element.
 * @param {HTMLInputElement} confirmPassword - The confirm password input element.
 */
function clearData(password, confirmPassword) {
    password.value = "";
    confirmPassword.value = "";
}


/**
 * Sends the contact data to the database to be stored in the "contacts" collection.
 * 
 * @async
 * @function updateContacts
 * @param {Object} registerData - The contact data to be saved.
 * @param {string} registerData.name - The name of the contact.
 * @param {string} registerData.mail - The email address of the contact.
 * 
 * @returns {Promise<void>} Resolves when the contact data has been successfully saved.
 */
async function updateContacts(registerData) {
    const response = await fetch(BASE_URL + "/contacts" + ".json", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
    });

    const result = await response.json();
}

/**
 * Sends the user's login data to the database to be stored in the "users" collection.
 * Clears form data and redirects the user to the login page on success.
 * 
 * @async
 * @function updateUser
 * @param {Object} data - The user data to be saved.
 * @param {string} data.email - The email address of the user.
 * @param {string} data.password - The password of the user.
 * 
 * @returns {Promise<void>} Resolves when the user data has been successfully saved.
 */
async function updateUser(data) {
    const response = await fetch(BASE_URL + "/users" + ".json", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    clearAllUserData();

    window.location.href = "/index.html?msg=You Signed up successfully";
}
