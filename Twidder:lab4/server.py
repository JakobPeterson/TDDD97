from flask import Flask, jsonify, request, json, render_template
import json
import database_helper
from email_validator import validate_email
from flask_sock import Sock
from flask_bcrypt import Bcrypt
import smtplib
import ssl
from email.message import EmailMessage


import hmac
import base64
import hashlib
from datetime import datetime, timedelta

app = Flask(__name__)
sock = Sock(app)
sockets = {}

bcrypt = Bcrypt(app)

@app.route("/token_check", methods = ['POST'])
def recieve_hmac_token():
    token = request.headers['Authorization']
    hash_token = request.json()
    comapre_token = hmac.new('secret', msg=token, digestmod=hashlib.sha256)
    if hash_token == compare_token:
        return token, 200
    else:
        return "", 400
    



@app.route("/", methods = ['GET'])
def root():
    return render_template("client.html"), 200

@sock.route('/profileview')
def socket_connect(ws):
    while True:
        token = ws.receive()
        email = database_helper.token_to_email(token)
        if email:
            sockets[email] = ws
            print("email added in ws")
        else:
            print("email not found") ## problem vid displayview efter användning av funktioner
            


@app.teardown_request
def teardown(exception):
    database_helper.disconnect()


@app.route('/sign_out', methods=['PUT'])
def sign_out():
    token = request.headers['Authorization']
    print("signout token: " + token)
    email = database_helper.token_to_email(token)
    print("signout email: " + email)
    if (email != None):
        if email in sockets:
            del sockets[email]
        if(database_helper.remove_user(token)):
            return "", 200
        else:
            return "", 404
    else:
        return "", 401

@app.route('/sign_in', methods=['POST'])
def sign_in():
    data = request.get_json()
    email = data['email']
    password = data['password']
    user = database_helper.find_user(email)

    #Check if there is a user with that email
    if (user != None):
        #Check if the email and username is correct
        if  user[1] == email and bcrypt.check_password_hash(user[3], password): ## new
            if email in sockets:
                other_ws = sockets[email]
                other_ws.send('signout')
                #other_ws.close()
                database_helper.remove_user_by_email(email)
                del sockets[email]
            token = database_helper.generate_token()
            logged = database_helper.logged_in(email, token)
            if (logged):
                return jsonify(token), 200
            else:
                return "", 200
        else:
            #Error: wrong password or username
            return "", 404
    else:
        #There is no user with that username
        return "", 400
    

@app.route('/sign_up', methods=['POST'])
def sign_up(): 
    data = request.get_json()
    email = data['email']
    password = data['password']
    firstname = data['firstname']
    familyname = data['familyname']
    gender = data['gender']
    city = data['city']
    country = data['country']

    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8') ## new
    print(pw_hash)
    
    #Checking if there is no user with that email
    if (database_helper.find_user(email) is None):
        if not (validate_email(email) == True or
            len(password) < 2 or
            len(firstname) == None or
            len(familyname) == None or
            len(gender) == None or
            len(city) == None or
            len(country) == None):
            #Reg the new user
            success = database_helper.reguser(email, pw_hash, firstname, familyname, gender, city, country)
            if (success == True):
                return "", 200 #New user
            else:
                return "", 404 #Failed to create new user
            
        else:
            return "", 400 #Invalid data
    else:
            return "", 409 #user already excists 
   




@app.route('/change_password', methods = ['PUT'])
def change_password():
    token = request.headers['Authorization']
    if(token):
        data = request.get_json()
        password = data['password']
        newpassword = data['newpassword']
        email = database_helper.token_to_email(token)
        print("email: " + email)
        user = database_helper.find_user(email)
        print("user: " + user[3])
        if bcrypt.check_password_hash(user[3], password): ## new
            database_helper.change_password(email, bcrypt.generate_password_hash(newpassword).decode('utf-8')) ## new
            return "", 200
        else:
            return "", 404
    else:
        return "", 401
    

@app.route('/get_user_data_by_email', methods = ['PUT'])
def get_user_data_by_email():
    token = request.headers['Authorization']
    data = request.get_json()
    email = data['email']
    if(token != None):
        if (database_helper.find_user(email)):
            user = database_helper.user_data_by_email(email)
            if not (user==None):
                return jsonify(user), 200
            else:
                return "", 404
        else:
            return "", 404
    else:
        return "", 401    

@app.route('/get_user_data_by_token', methods = ['GET'])
def get_user_data_by_token():
    token = request.headers['Authorization']
    if(token):
        email = database_helper.token_to_email(token)
        if (email != None):
            user = database_helper.user_data_by_email(email)
            if (user != None):
                return jsonify(user), 200
            else:
                return "", 404
        else:
            return  "", 404
    else:
        return "", 401    

@app.route('/get_user_messages_by_email', methods = ['PUT'])
def get_user_messages_by_email():
    data = request.get_json()
    email = data['email']
    if (database_helper.find_user(email)):
        messages = database_helper.get_user_messages_by_email(email)
        return jsonify(messages), 200
    else:
        return "", 404

@app.route('/get_user_messages_by_token', methods = ['GET'])
def get_user_messages_by_token():
    token = request.headers['Authorization']
    email = database_helper.token_to_email(token)
    messages = database_helper.get_user_messages_by_email(email)
    if (messages != None):
        return jsonify(messages), 200
    else:
        return "", 400

@app.route('/post_message', methods = ['POST'])
def post_message():
    data = request.get_json()
    token = request.headers['Authorization']
    message = data['message']
    if (message != None):
        to_email = data['to_email']
        if(token != None):
            from_email = database_helper.token_to_email(token)
            if (from_email != None):
                if (to_email == ""):
                    to_email = from_email
                if (database_helper.find_user(to_email) != None):
                    success = database_helper.post_message(from_email, message, to_email)
                    if(success):
                        return "", 201
                    else:
                        return "", 404
                else:
                    return "", 404
            else:
                return "", 404
        else:
            return "", 404
    else: 
        return "", 400


@app.route('/recover_password', methods = ['POST'])
def recover_password():
    data = request.get_json()
    email = data['email']
    user = database_helper.find_user(email)
    
    if(user != None):
        newpassword = database_helper.generate_token()
        from_email = 'elcustomerosuporto@gmail.com'
        from_password = 'elcnmtoqhloedggi'
        to_email = email
        body = "Hello there! Here is your new password for the lovely site twidder! New password: " + newpassword +"\nBest regards, Twidder support<3"
        subject = "New password for Twidder"

        em = EmailMessage()
        em['From'] = from_email
        em['To'] = email
        em['Subject'] = subject
        em.set_content(body)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(from_email, from_password)
            smtp.sendmail(from_email, to_email, em.as_string())
        
        success = database_helper.change_password(email, bcrypt.generate_password_hash(newpassword).decode('utf-8'))
        if(success):
            return "", 200
        else:
            return "", 500
    else:
        return "", 404 #No such user





if __name__ == '__main__':
    app.debug = True
    database_helper.init_db(app)
    app.run
