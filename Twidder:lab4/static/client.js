
//contains all the functionality



displayView = function(){
    //the code required to display a view
    if(localStorage.getItem('token') == null || localStorage.getItem('token') == ""){
        console.log(localStorage.getItem('token'));
        document.getElementById('content').innerHTML = document.getElementById('welcomeview').innerHTML;   
    }
    else {
        document.getElementById('content').innerHTML = document.getElementById('profileview').innerHTML;
        document.getElementById('home_button').style.color = "green";
        
        user_info();
        load_text();
        socket_connect();
    }    
}


function socket_connect(){
    var socket = new WebSocket('ws://127.0.0.1:8000/profileview');
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
    //localStorage.setItem('token', "");
    displayView();
}


function hmac_token(){
    console.log("2");
    let token = localStorage.getItem('token');
    console.log("333");
    let secret = 'secret';
    console.log("4444");
    console.log("666666");
    var hmac = CryptoJS.AES.encrypt("hej", "hej");
    console.log("55555");
    console.log(hmac);
    return hmac;
}

function changepassword(formData) {
    var oldpassword = formData.oldpassword.value;
    var newpassword = formData.newpassword.value;
    var renewpassword = formData.renewpassword.value;

    if(checkpassword(newpassword, renewpassword, 'changepassword_error')){
        let message = "";
        let req = new XMLHttpRequest();
        req.open("PUT", "/change_password", true);
        req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        // console.log("0")
        // req.setRequestHeader("email", localStorage.getItem('email'));
        // console.log("1")
        //token = hmac_token();
        
        req.setRequestHeader("Authorization", localStorage.getItem('token'));
        req.send(JSON.stringify({'password' : oldpassword, 'newpassword' : newpassword}));
        req.onreadystatechange =  function(){
            if (req.readyState == 4){
                if (req.status == 200){
                    message = "Password changed!";
                    document.getElementById("changepassword_error").style.color = "green";
                }
                else if (req.status == 401){
                    message = "Not authorized.";
                    document.getElementById("changepassword_error").style.color = "red";
                }
                else if (req.status == 404){
                    message = "Incorrect password!";
                    document.getElementById("changepassword_error").style.color = "red";
                }
                document.getElementById('changepassword_error').innerHTML = message;
            }
        }
    }
}

checkpassword = function(password, repassword, section_error){

    var errormessage = ""
    document.getElementById(section_error).style.color = "red";
    if (password.length < 2) {
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
    var message = ""

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
                if (req.status == 200){
                    message = "New user created!";
                    document.getElementById("signup_error").style.color = "green";
                }
                else if (req.status == 401){
                    message = "User already exist!";
                    document.getElementById("signup_error").style.color = "red";
                }
                else if (req.status == 400){
                    message = "Wrong data format!";
                    document.getElementById("signup_error").style.color = "red";
                }
                else if (req.status == 404){
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
    console.log(localStorage.getItem('email'))
    let message = " ";
    let req = new XMLHttpRequest();
    req.open("POST", "/sign_in", true);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    req.send(JSON.stringify(user));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                message = "Sign in successful!";
                //document.getElementById("signin_error").style.color = "green";
                localStorage.setItem('token', JSON.parse(req.responseText));
                displayView();
            }
            else if (req.status == 401){
                message = "Something!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 400){
                message = "Wrong data format!";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
            }
            else if (req.status == 404){
                message = "Failed to log in!";
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



signout = function() {
    var message = "";
    var req = new XMLHttpRequest();
    req.open("DELETE", "/sign_out", true); 
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    req.setRequestHeader("Email", localStorage.getItem('email'));
    token = hmac_token(); 
    req.setRequestHeader("Authorization", token);
    req.send(null);
    req.onreadystatechange = function(){
        if (req.readyState == 4){
            if (req.status == 200){
                console.log("signout");
                message = "Signed out successfully!";
                localStorage.setItem('token', "");
                console.log("token before signout reload: " + token)
                displayView();
            }
            else if (req.status == 401){
                message = "User doesn't exist!";
            }
            else if (req.status == 404){
                message = "Failed to sign out!";
            }
        }
    }
}

user_info = function() {
    var message = "";
    var req = new XMLHttpRequest();
    req.open("GET", "/get_user_data_by_token", true);
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
    req.send(null);
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
                document.getElementById("home_error").style.color = "green";
            }
            else if (req.status == 401){
                message = "Not authorized.";
                document.getElementById("home_error").style.color = "red";
            }
            else if (req.status == 404){
                message = "Failed to load info!";
                document.getElementById("home_error").style.color = "red";
                localStorage.setItem('token', "");
                displayView();
            }
            document.getElementById('home_error').innerHTML = message;
        }
    }
}

search_user_info = function(formData) {
    var message = "";
    var req = new XMLHttpRequest();
    //let data = formData.search_user_text.value.toLowerCase();
    req.open("PUT", "/get_user_data_by_email", true);
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(JSON.stringify({'email':formData.search_user_text.value.toLowerCase()}));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                document.getElementById("search_user_info").style.display = "block";
                message = "User info recieved!";
                document.getElementById("search_error").style.color = "green";
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
                message = "Not authorized.";
                document.getElementById("search_error").style.color = "red";
            }
            else if (req.status == 404){
                document.getElementById("search_user_info").style.display = "none";
                message = "Failed to load info!";
                document.getElementById("search_error").style.color = "red";
            }
            document.getElementById('search_error').innerHTML = message;
        }
    }    
}


post = function(formData){
    
    var message = "";
    var req = new XMLHttpRequest();
    req.open("POST", "/post_message", true); 
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
    req.send(JSON.stringify({
        'message' : formData.post_text.value,
        'to_email' : "" }));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 201){
                message = "Message posted!";
            }
            else if (req.status == 404){
                message = "Wright a message"
            }
            else if (req.status == 404){
                message = "Failed to post message!";
            }
            document.getElementById('home_error').innerHTML = message;
        }
    }
}
post_other = function(formData){
    var message = "";
    var req = new XMLHttpRequest();
    req.open("POST", "/post_message", true); 
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    to_email = document.getElementById('search_user_email').innerHTML;
    req.send(JSON.stringify({
        'message' : formData.post_text_other.value,
        'to_email' : to_email}));
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 201){
                message = "Message posted!";
            }
            else if (req.status == 404){
                message = "Wright a message"
            }
            else if (req.status == 404){
                message = "Failed to post message!";
            }
            document.getElementById('search_error').innerHTML = message;
        }
    }
}

function load_text(){
    var message = "";
    var req = new XMLHttpRequest();
    req.open("GET", "/get_user_messages_by_token", true); 
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
    req.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    req.send(null);
    var text_format = "";
    req.onreadystatechange =  function(){
        if (req.readyState == 4){
            if (req.status == 200){
                let text = JSON.parse(req.responseText);
                message = "Messages retrieved!";
                for(let i = 0; i <= text.length-1; i++){
                    text_format += text[i][1]+ ": " + text[i][2] + "\n";
                }
                document.getElementById('text_area').innerHTML = text_format;
            }
            else if (req.status == 401){
                message = "nä such user";
            }
            else if (req.status == 404){
                message = "ping";
            }
        }
    }
}

function load_text_other(){
    var message = "";
    var req = new XMLHttpRequest();
    req.open("PUT", "/get_user_messages_by_email", true); 
    req.setRequestHeader("Authorization", localStorage.getItem("token"));
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
                message = "nä such user";
            }
            else if (req.status == 404){
                message = "ping";
            }
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
                message = "Twidder fail";
                document.getElementById("signin_error").style.color = "red";
                document.getElementById('signin_error').innerHTML = message;
                
            }
        }
    }


}
