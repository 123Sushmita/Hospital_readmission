-- create databse 
create database morgan_stanley;
-- use dbs 
use morgan_stanley;
-- create loan table 
CREATE TABLE loans (
    loan_id INT,
    loan_type VARCHAR(50),
    loan_amount INT,
    interest_rate FLOAT,
    term INT,
    monthly_income INT,
    monthly_debt INT,
    property_value INT,
    credit_score INT,
    loan_status VARCHAR(50),
    investor_type VARCHAR(50),
    payment_status VARCHAR(50)
);

-- loading data 
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 9.1/Uploads/Morgan_Stanley.csv'
INTO TABLE loans
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

select * from loans;

-- DTI 

SELECT 
    loan_id,
    loan_type,
    monthly_income,
    monthly_debt,
    ROUND(monthly_debt * 1.0 / monthly_income, 2) AS DTI
FROM loans;

-- LTV 

SELECT 
    loan_id,
    loan_type,
    loan_amount,
    property_value,
    CASE 
        WHEN property_value > 0 
        THEN ROUND(loan_amount * 1.0 / property_value, 2)
        ELSE NULL
    END AS LTV
FROM loans;


-- Risk flag 
SELECT *,
CASE 
    WHEN (monthly_debt * 1.0 / monthly_income) > 0.4 
         OR (property_value > 0 AND loan_amount * 1.0 / property_value > 0.8)
         OR credit_score < 680
    THEN 'High Risk'
    ELSE 'Low Risk'
END AS risk_flag
FROM loans;


-- loan type distribution 
SELECT 
    loan_type,
    COUNT(*) AS total_loans,
    SUM(loan_amount) AS total_exposure
FROM loans
GROUP BY loan_type;

-- Loan Status (BUY / SELL / HOLD VIEW
SELECT 
    loan_status,
    COUNT(*) AS count_loans,
    SUM(loan_amount) AS exposure
FROM loans
GROUP BY loan_status;

-- Investor View
SELECT 
    investor_type,
    COUNT(*) AS loans,
    SUM(loan_amount) AS total_investment
FROM loans
GROUP BY investor_type;

-- Payment Performance
SELECT 
    payment_status,
    COUNT(*) AS total_loans
FROM loans
GROUP BY payment_status;

-- High Risk Loans Only
SELECT 
    loan_id,
    loan_type,
    loan_amount,
    ROUND(monthly_debt * 1.0 / monthly_income, 2) AS DTI,
    credit_score
FROM loans
WHERE (monthly_debt * 1.0 / monthly_income) > 0.4
   OR credit_score < 680;
   
   
