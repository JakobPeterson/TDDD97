
//contains all the functionality

displayView = function(){
    //the code required to display a view
    if(localStorage.getItem('token') == null || localStorage.getItem('token') == ""){
        alert("1");
        console.log(localStorage.getItem('token'));
        document.getElementById('content').innerHTML = document.getElementById('welcomeview').innerHTML;   
    }
    else {
        alert("bajs");
        document.getElementById('content').innerHTML = document.getElementById('profileview').innerHTML;
        document.getElementById('home_button').style.color = "green";
        
        alert("1");
        user_info();
        alert("2");
        load_text();
        alert("3");
        socket_connect();
        alert("4");
    }    
}


function socket_connect(){
    var socket = new WebSocket('ws://0.0.0.0:5000/profileview');
    socket.onopen = function(){
        socket.send(localStorage.getItem('token'));
    }
    // socket.onclose = function(){
    //     socket = null;
    // }
    console.log("success");
    socket.addEventListener('message', (event) => {
        console.log(event.data);
        if(event.data == 'signout'){
            //signout();
            localStorage.setItem('token', "");
            displayView();
        }
    });
}


window.onload = function() {
    localStorage.setItem('token', "");
    displayView();
}


function hmac_token(){
    let token = localStorage.getItem('token');
    let secret = 'secret';
    var hmac = CryptoJS.HmacSHA256(token, token);
    return hmac;
}

signout = function() {
    var message = "";
    var req = new XMLHttpRequest();
    req.open("DELETE", "/sign_out", true); 
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    //data = {'email': localStorage.getItem('email'), 'token': token};
    req.setRequestHeader("Authorization", token);
    req.send(null);
    req.onreadystatechange = function(){
        if (req.readyState == 4){
            if (req.status == 200){
                message = "Signed out successfully!";
                localStorage.setItem('token', "");
                displayView();
            }
            else if (req.status == 500){
                message = "Failed to sign out!";
            }
            else if (req.status == 401){
                message = "You are not logged in!";
            }
        }
    }
}

function changepassword(formData) {
    var oldpassword = formData.oldpassword.value;
    var newpassword = formData.newpassword.value;
    var renewpassword = formData.renewpassword.value;

    if(checkpassword(newpassword, renewpassword, 'account_error')){
        let message = "";
        let req = new XMLHttpRequest();
        req.open("PUT", "/change_password", true);
        req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        req.setRequestHeader("Email", localStorage.getItem('email'));
        token = hmac_token(); 
        req.setRequestHeader("Authorization", token);
        req.send(JSON.stringify({'password' : oldpassword, 'newpassword' : newpassword}));
        req.onreadystatechange =  function(){
            if (req.readyState == 4){
                if (req.status == 200){
                    message = "Password changed!";
                    document.getElementById("account_error").style.color = "black";
                }
                else if (req.status == 401){
                    message = "Not authorized.";
                    document.getElementById("account_error").style.color = "red";
                }
                else if (req.status == 403){
                    message = "Incorrect password!";
                    document.getElementById("account_error").style.color = "red";
                }
                else if (req.status == 400){
                    message = "Password to short!";
                    document.getElementById("account_error").style.color = "red";
                }
                document.getElementById('account_error').innerHTML = message;
            }
        }
    }
}

checkpassword = function(password, repassword, section_error){
    document.getElementById(section_error).style.color = "red";
    if (password.length < 6) {
        document.getElementById(section_error).innerHTML = "Password to short!";
        return false;
    }
    else if (repassword != password) {
        document.getElementById(section_error).innerHTML = "Password doesn't match!";
        return false;
    }
    else {
        document.getElementById(section_error).style.color = "green";
        document.getElementById(section_error).innerHTML = "Password OK!";
        return true;
    }
}   

function signup(formData){
    var password = formData.password.value;
    var repassword = formData.repassword.value;

    if(checkpassword(password, repassword, 'signup_error')){
        var email = formData.email.value.toLowerCase();
        var password = formData.password.value;
        var firstname = formData.firstname.value;
        var familyname = formData.familyname.value;
        var gender = formData.gender.value;
        var city = formData.city.value;
        var country = formData.country.value;

        user = new Array();
        user = {
            'email' : email,
            'password' : password,
            'firstname' : firstname,
            'familyname' : familyname,
            'gender' : gender,
            'city' : city,
            'country' : country
        };
        let req = new XMLHttpRequest();
        req.open("POST", "/sign_up", true);
        req.setRequestHeader("Content-type", "application/json;charset=UTF-8")
        req.send(JSON.stringify(user));
        req.onreadystatechange =  function(){
            if (req.readyState == 4){
                let message = ""
                if (req.status == 201){
                    message = "New user created!";
                    document.getElementById("signup_error").style.color = "green";
                }
                else if (req.status == 409){
                    message = "User already exist!";
                    document.getElementById("signup_error").style.color = "red";
                }
                else if (req.status == 400){
                    message = "Wrong data format!";
                    document.getElementById("signup_error").style.color = "red";
                }
                else if (req.status == 500){
                    message = "Failed to create a new user!";
                    document.getElementById("signup_error").style.color = "red";
                }
                document.getElementById("signup_error").innerHTML = message;
            }
        }
          
    }      
}

function signin(formData){
    user = {'email':formData.signinEmail.value.toLowerCase(), 'password':formData.signinPassword.value};
    localStorage.setItem('email',formData.signinEmail.value.toLowerCase());
    let message = " ";
    let req = new XMLHttpRequest();
    req.open("POST", "/sign_in", true);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    req.send(JSON.stringify(user));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                message = "Sign in successful!";
                localStorage.setItem('token', JSON.parse(req.responseText));
                displayView();
            }
            else if (req.status == 401){
                message = "Wrong password or username!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 400){
                message = "Wrong data format!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 404){
                message = "User doesn't exist!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 500){
                message = "Failed to sign in!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            
        }
    }
}



tabview = function(tabname) {

    document.getElementById('home').style.display = "none";
    document.getElementById('browse').style.display = "none";
    document.getElementById('account').style.display = "none";
    document.getElementById('home_button').style.color = "black";
    document.getElementById('browse_button').style.color = "black";
    document.getElementById('account_button').style.color = "black";

    document.getElementById(tabname+"_button").style.color = "green";
    document.getElementById(tabname).style.display = "block";
}



user_info = function() {
    var message = "";
    alert("hejdasasda");
    var req = new XMLHttpRequest();
    alert("hedasj");
    req.open("GET", "/get_user_data_by_token", true);
    alert("hedasdj");
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    alert("hejasds");
    req.setRequestHeader("Email", localStorage.getItem('email'));
    alert("heas");
    token = hmac_token(); 
    alert("hejaa");
    req.setRequestHeader("Authorization", token);
    alert("hejsaaa");
    req.send(null);
    alert("hejsa");
    req.onreadystatechange = function(){
        if (req.readyState == 4){
            
            if (req.status == 200){
                let data = JSON.parse(req.responseText);
                document.getElementById("user_email").innerHTML = data[0];
                document.getElementById('user_firstname').innerHTML = data[2];
                document.getElementById('user_familyname').innerHTML = data[3];
                document.getElementById('user_gender').innerHTML = data[4];
                document.getElementById('user_city').innerHTML = data[5];
                document.getElementById('user_country').innerHTML = data[6];
                message = "User info recieved!";
            }
            else if (req.status == 401){
                message = "You are not signed in lol.";
            }
            else if (req.status == 404){
                message = "Failed to load info!";
 
                localStorage.setItem('token', "");
                displayView();
            }
            document.getElementById('home_error').innerHTML = message;
        }
    }
}

search_user_info = function(formData) {
    var req = new XMLHttpRequest();
    //let data = formData.search_user_text.value.toLowerCase();
    req.open("PUT", "/get_user_data_by_email", true);
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(JSON.stringify({'email':formData.search_user_text.value.toLowerCase()}));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            let message = "";
            if (req.status == 200){
                document.getElementById("search_user_info").style.display = "block";
                message = "User info recieved!";
                let data = JSON.parse(req.responseText);
                document.getElementById('search_user_email').innerHTML = data[0];
                document.getElementById('search_user_firstname').innerHTML = data[2];
                document.getElementById('search_user_familyname').innerHTML = data[3];
                document.getElementById('search_user_gender').innerHTML = data[4];
                document.getElementById('search_user_city').innerHTML = data[5];
                document.getElementById('search_user_country').innerHTML = data[6];
                load_text_other();
            }
            else if (req.status == 401){
                document.getElementById("search_user_info").style.display = "none";
                message = "You are not logged in lol.";
            }
            else if (req.status == 404){
                document.getElementById("search_user_info").style.display = "none";
                message = "Failed to load info!";
            }
            document.getElementById('browse_error').innerHTML = message;
        }
    }    
}


post = function(formData){
    var req = new XMLHttpRequest();
    req.open("POST", "/post_message", true); 
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.send(JSON.stringify({
        'message' : formData.post_text.value,
        'to_email' : "" }));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            let message = "";
            if (req.status == 201){
                message = "Message posted!";
            }
            else if (req.status == 400){
                message = "Write a message!"
            }
            else if (req.status == 401){
                message = "You are not logged in lol.!";
            }
            else if (req.status == 410){
                message = "The receiver doesn't exist!";
            }
            else if (req.status == 500){
                message = "Failed to post messsage!";
            }
            document.getElementById('home_error').innerHTML = message;
        }
    }
}
post_other = function(formData){
    var req = new XMLHttpRequest();
    req.open("POST", "/post_message", true); 
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    to_email = document.getElementById('search_user_email').innerHTML;
    req.send(JSON.stringify({
        'message' : formData.post_text_other.value,
        'to_email' : to_email}));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            let message = "";
            if (req.status == 201){
                message = "Message posted!";
            }
            else if (req.status == 400){
                message = "Write a message!"
            }
            else if (req.status == 401){
                message = "You are not logged in lol.!";
            }
            else if (req.status == 410){
                message = "The receiver doesn't exist!";
            }
            else if (req.status == 500){
                message = "Failed to post messsage!";
            }
            document.getElementById('browse_error').innerHTML = message;
        }
    }
}

function load_text(){
    var req = new XMLHttpRequest();
    req.open("GET", "/get_user_messages_by_token", true); 
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(null);
    var text_format = "";
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            let message = "";
            if (req.status == 200){
                let text = JSON.parse(req.responseText);
                message = "Messages retrieved!";
                for(let i = 0; i <= text.length-1; i++){
                    text_format += text[i][1]+ ": " + text[i][2] + "\n";
                }
                document.getElementById('text_area').innerHTML = text_format;
            }
            else if (req.status == 401){
                message = "Your are not signed in.";
            }
            else if (req.status == 404){
                message = "No messages found.";
            }
            document.getElementById('home_error').innerHTML = message;
        }
    }
}

function load_text_other(){
    var message = "";
    var req = new XMLHttpRequest();
    req.open("PUT", "/get_user_messages_by_email", true); 
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(JSON.stringify({'email':document.getElementById('search_user_text').value.toLowerCase()}));
    var text_format = "";
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                var text_array = JSON.parse(req.responseText);
                message = "Messages retrieved!";
                for(let i = 0; i <= text_array.length-1; i++){
                    text_format += text_array[i][1]+ ": " + text_array[i][2] + "\n";
                }
                document.getElementById('text_area_other').innerHTML = text_format;
            }
            else if (req.status == 401){
                message = "Your are not signed in.";
            }
            else if (req.status == 404){
                message = "No messages found.";
            }
            document.getElementById('browse_error').innerHTML = message;
        }
    }
}

function recover(formData){
    console.log("hej");
    var req = new XMLHttpRequest();
    req.open("POST", "/recover_password", true); 
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(JSON.stringify({'email':formData.recoveremail.value.toLowerCase()}));
    console.log(formData.recoveremail.value.toLowerCase());
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                message = "Check your email for the new password";
                document.getElementById("signin_error").style.color = "green";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 404){
                message = "There is no user with that username";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;   
            }
            else if (req.status == 500){
                message = "Failed to send new password";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 400){
                message = "Wrong format";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
        }
    }


}
