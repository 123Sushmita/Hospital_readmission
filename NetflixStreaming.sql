create database Netflix_Streaming; 
use Netflix_Streaming;




-- Users table
create table users ( 
User_id int auto_increment primary key ,
name  varchar(100 ) not null, 
email varchar(200) unique , 
age int , 
gender enum('Male', 'Female', 'other'),
country varchar(100),
subscription_type enum ('Basic', 'Standard', 'Premium'),
subscription_start date,
subscription_end date
);

-- Content table 
create table content ( 
content_id int auto_increment primary key , 
title varchar(200), 
genre varchar(100), 
duration_min float , 
release_year year, 
rating float 
);

-- view table 
create table view ( 
view_id int auto_increment primary key, 
User_id int, 
content_id int, 
watch_date datetime, 
watch_time_minutes float, 
device_type enum ('Mobile','Desktop','Smart_TV','Tablet') , 
FOREIGN KEY (User_id) REFERENCES users(User_id),
FOREIGN KEY (content_id) REFERENCES content(content_id)
);
-- Payment Table
create table payment( 
payment_id int auto_increment primary key , 
User_id int, 
Payment_method Enum('Credit Crad', 'Debit Card' , 'PayPal', 'Other'), 
payment_Staus Enum ('Paid', 'Failed','Pending'),
payment_date Date , 
amount decimal (6,2) , 
foreign key (User_id) References users(User_id)
);

-- Review table 
create table review( 
review_id int auto_increment primary key, 
User_id int, 
content_id int, 
review_date Date, 
rating float,
foreign key (User_id) references users(User_id) , 
foreign key (content_id) references content(content_id)
);


-- load data of users 
LOAD DATA INFILE 'C:\\ProgramData\\MySQL\\MySQL Server 9.1\\Uploads\\users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(name, email, age, gender, country, subscription_type, subscription_start, subscription_end)
SET email = NULLIF(email,'NULL');
-- checking the data 
select * from users;
-- loading content data 
LOAD DATA INFILE 'C:\\ProgramData\\MySQL\\MySQL Server 9.1\\Uploads\\content.csv'
INTO TABLE content
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(title, genre, duration_min, release_year, rating);
-- checking the data 
select * from content;
-- lodaing the view data 
LOAD DATA INFILE 'C:\\ProgramData\\MySQL\\MySQL Server 9.1\\Uploads\\view.csv'
INTO TABLE view
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(User_id, content_id, watch_date, watch_time_minutes, device_type);

-- Checking the data 
select * from view;







