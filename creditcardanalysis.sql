USE fraud_db;

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(50),
    amount DECIMAL(10,2),
    transaction_hour INT,
    merchant_category VARCHAR(50),
    foreign_transaction TINYINT(1),
    location_mismatch TINYINT(1),
    device_trust_score DECIMAL(5,2),
    velocity_last_24h INT,
    cardholder_age INT,
    is_fraud TINYINT(1)
);
USE fraud_db;
SELECT * from creditcardfraud;


select  transaction_id, amount, transaction_hour, merchant_category, foreign_transaction, location_mismatch, 
device_trust_score, velocity_last_24h, cardholder_age, is_fraud, 
-- Case fraud calculation 
( 
CASE WHEN amount > 200 THEN 1 ELSE 0 END + 
CASE WHEN velocity_last_24h > 3 THEN 1 ELSE 0 END + 
CASE WHEN foreign_transaction = 1 THEN 1 ELSE 0 END + 
CASE WHEN device_trust_score > 60 THEN 1 ELSE 0 END + 
CASE WHEN location_mismatch = 1 THEN 1 ELSE 0 END 
) as fraud_score 
from creditcardfraud
limit 20;

select * from (
select  transaction_id, amount, transaction_hour, merchant_category, foreign_transaction, location_mismatch, 
device_trust_score, velocity_last_24h, cardholder_age, is_fraud, 
-- Case fraud calculation 
( 
CASE WHEN amount > 200 THEN 1 ELSE 0 END + 
CASE WHEN velocity_last_24h > 3 THEN 1 ELSE 0 END + 
CASE WHEN foreign_transaction = 1 THEN 1 ELSE 0 END + 
CASE WHEN device_trust_score > 60 THEN 1 ELSE 0 END + 
CASE WHEN location_mismatch = 1 THEN 1 ELSE 0 END 
) as fraud_score 
from creditcardfraud
) as scored 
order by fraud_score desc limit 10;




-- Fraud by foreign transaction 
select * from creditcardfraud;
select foreign_transaction, count(*) as total , SUM(CASE WHEN is_fraud = 1 then 1 else  0 end ) as fraud_count, 
round (SUM( CASE when is_fraud = 1 then 1 else 0 end ) * 100.0 / count(*) ,2 ) as fraud_rate from creditcardfraud 
group by foreign_transaction;

-- fraud by loaction mismatch 
select location_mismatch , count(*) as total , 
sum(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END ) as fraud_count, 
round(SUM( CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END  ) * 100.0 / count(*) ,2) as fraud_rate from creditcardfraud group by location_mismatch ;





-- fraud by transaction hour 
select transaction_hour, count(*) as total , 
sum(case when is_fraud =1 then 1 else 0 end ) as fraud_count 
from creditcardfraud 
group by transaction_hour 
order by transaction_hour;


























