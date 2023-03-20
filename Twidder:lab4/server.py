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


def hmac_token():
    print("finction")
    email = request.headers['Email']
    print(email)
    token = database_helper.token_by_email(email)
    print(token)
    hash_token = request.headers['Authorization']
    print(hash_token)
    if (token != None):
        compare_token = hmac.new(token.encode('utf-8'), token.encode('utf-8'), hashlib.sha256)
        print(compare_token.hexdigest())
        if (hash_token == compare_token.hexdigest()):
            print("Same")
            return token
        else:
            return ""
    else:
        return ""
    

@app.route("/", methods = ['GET'])
def root():
    return render_template("client.html"), 200


@sock.route('/profileview')
def socket_connect(ws):
    while True:
        token = ws.receive()
        email = database_helper.token_to_email(token)
        if (email != None):
            sockets[email] = ws
            print("email added in ws")
        else:
            print("email not found") ## problem vid displayview efter användning av funktioner
            


@app.teardown_request
def teardown(exception):
    database_helper.disconnect()


@app.route('/sign_out', methods=['DELETE'])
def sign_out():
    token = request.headers['Authorization'] ##token = hmac_token() 
    email = database_helper.token_to_email(token)
    if (email != None):
        if (email in sockets):
            del sockets[email]
        if (database_helper.remove_user(token)):
            return "", 200 #OK
        else:
            return "", 500 #Internal server error
    else:
        return "", 401 #Unathorized


@app.route('/sign_in', methods=['POST'])
def sign_in():
    data = request.get_json()
    email = data['email']
    if (validate_email(email)):
        password = data['password']
        user = database_helper.find_user(email)
        if (user != None):
            if  (user[1] == email and bcrypt.check_password_hash(user[3], password)): ## new
                if (email in sockets):
                    other_ws = sockets[email]
                    other_ws.send('signout')
                    other_ws.close()
                    database_helper.remove_user_by_email(email)
                    del sockets[email]
                token = database_helper.generate_token()
                logged = database_helper.logged_in(email, token)
                if (logged):
                    return jsonify(token), 200 #OK
                else:
                    return "", 500 #Internal server error
            else:
                return "", 401 #Not found, wrong password or username
        else:
            return "", 404 #Not found, There is no user with that username
    else:
        return "", 400 #Bad request
    

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
    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    if (database_helper.find_user(email) is None):
        if not (validate_email(email) == True or
            len(password) < 6 or
            len(firstname) == None or
            len(familyname) == None or
            len(gender) == None or
            len(city) == None or
            len(country) == None):
            success = database_helper.reguser(email, pw_hash, firstname, familyname, gender, city, country)
            if (success == True):
                return "", 201 #Created, new user
            else:
                return "", 500 #Internal server error, failed to create new user even though correct data
            
        else:
            return "", 400 #Bad request, invalid data
    else:
            return "", 409 #Conflict, user already excists 
   

@app.route('/change_password', methods = ['PUT'])
def change_password():
    token = request.headers['Authorization'] ##token = hmac_token() 
    user = database_helper.token_to_email(token)
    if(user):  
        data = request.get_json()
        password = data['password']
        newpassword = data['newpassword']
        if (len(newpassword) > 6):
            email = database_helper.token_to_email(token)
            user = database_helper.find_user(email)
            if (bcrypt.check_password_hash(user[3], password)):
                database_helper.change_password(email, bcrypt.generate_password_hash(newpassword).decode('utf-8')) ## new
                return "", 200 #OK
            else:
                return "", 403 #Forbidden
        else:
            return "", 400 #Bad request
    else:
        return "", 401 #Unathorized
    

@app.route('/get_user_data_by_email', methods = ['PUT'])
def get_user_data_by_email():
    token = request.headers['Authorization'] ##token = hmac_token() 
    data = request.get_json()
    email = data['email']
    user_email = database_helper.token_to_email(token)
    if (user_email != None):
        user = database_helper.user_data_by_email(email)
        if (user != None):
            return jsonify(user), 200 #OK
        else:
            return "", 404 #Not found
    else:
        return "", 401 #Unathorized    


@app.route('/get_user_data_by_token', methods = ['GET'])
def get_user_data_by_token():
    token = request.headers['Authorization'] ##token = hmac_token() 
    email = database_helper.token_to_email(token)
    if (email != None):
        user = database_helper.user_data_by_email(email)
        if (user != None):
            return jsonify(user), 200 #OK
        else:
            return "", 404 #Nod found
    else:
        return  "", 401 #Unathorized


@app.route('/get_user_messages_by_email', methods = ['PUT'])
def get_user_messages_by_email():
    token = request.headers['Authorization'] ##token = hmac_token() 
    data = request.get_json()
    email = data['email']
    user_email = database_helper.token_to_email(token)
    if (token!=None):
        if (database_helper.find_user(email)):
            messages = database_helper.get_user_messages_by_email(email)
            return jsonify(messages), 200 #OK
        else:
            return "", 404 #Not found
    else: 
        return "", 401 #Unathorized

@app.route('/get_user_messages_by_token', methods = ['GET'])
def get_user_messages_by_token():
    token = request.headers['Authorization'] ##token = hmac_token() 
    email = database_helper.token_to_email(token)
    if (email != None):
        messages = database_helper.get_user_messages_by_email(email)
        if (messages != None):
            return jsonify(messages), 200
        else:
            return "", 404 #Not found
    else:
        return "", 401 #Unathorized

@app.route('/post_message', methods = ['POST'])
def post_message():
    data = request.get_json()
    token = request.headers['Authorization'] ##token = hmac_token() 
    from_email = database_helper.token_to_email(token)
    if (from_email != None):
        message = data['message']
        if (message != ""):
            to_email = data['to_email']
            if (to_email == ""):
                to_email = from_email
            if (database_helper.find_user(to_email) != None):
                success = database_helper.post_message(from_email, message, to_email)
                if(success):
                    return "", 201 #Created
                else:
                    return "", 500 #Internal server error
            else:
                return "", 410 #Gone
        else: 
            return "", 400 #Bad request
    else: 
        return "", 401 #Unathorized


@app.route('/recover_password', methods = ['POST'])
def recover_password():
    data = request.get_json()
    email = data['email']
    if (validate_email(email) == True):
        user = database_helper.find_user(email)
        if (user != None):
            newpassword = database_helper.generate_token()
            #from_email = 'elcustomerosuporto@gmail.com'
            #from_password = 'elcnmtoqhloedggi'
            from_email = 'katt.hejsan@gmail.com'
            from_password = 'zbwaapyrdfmhinww'
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
            if(success==True):
                return "", 200 #OK
            else:
                return "", 500 #Internal server error
        else:
            return "", 404 #Not found, no such user
    else:
        return "", 400 #Bad request



if __name__ == '__main__':
    app.debug = True
    database_helper.init_db(app)
    app.run