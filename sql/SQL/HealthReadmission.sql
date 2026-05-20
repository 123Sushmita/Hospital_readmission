-- create database 
create database hospital_readmission;

-- use databse hospital_readmission
use hospital_readmission;

-- create table hospital_analysis 
CREATE TABLE hospital_analysis (
    age VARCHAR(20),
    time_in_hospital INT,
    n_lab_procedures INT,
    n_procedures INT,
    n_medications INT,
    n_outpatient INT,
    n_inpatient INT,
    n_emergency INT,
    medical_specialty VARCHAR(100),
    diag_1 VARCHAR(100),
    diag_2 VARCHAR(100),
    diag_3 VARCHAR(100),
    glucose_test VARCHAR(20),
    A1Ctest VARCHAR(20),
    `change` VARCHAR(20),
    diabetes_med VARCHAR(20),
    readmitted VARCHAR(20)
);
-- show variables 
SHOW VARIABLES LIKE 'secure_file_priv';

-- load csv data 
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 9.1/Uploads/hospital_readmissions.csv'
INTO TABLE hospital_analysis
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- show table types , null or not
DESCRIBE hospital_analysis;

-- checking/ selecting  all the data 
select * from hospital_analysis;
select count(*) from hospital_analysis;

-- checking missing values 
SELECT
  SUM(CASE WHEN age IS NULL THEN 1 ELSE 0 END) AS age_nulls,
  SUM(CASE WHEN time_in_hospital IS NULL THEN 1 ELSE 0 END) AS time_in_hospital_nulls,
  SUM(CASE WHEN n_lab_procedures IS NULL THEN 1 ELSE 0 END) AS lab_procedures_nulls,
  SUM(CASE WHEN n_procedures IS NULL THEN 1 ELSE 0 END) AS procedures_nulls,
  SUM(CASE WHEN n_medications IS NULL THEN 1 ELSE 0 END) AS medications_nulls,
  SUM(CASE WHEN n_outpatient IS NULL THEN 1 ELSE 0 END) AS outpatient_nulls,
  SUM(CASE WHEN n_inpatient IS NULL THEN 1 ELSE 0 END) AS inpatient_nulls,
  SUM(CASE WHEN n_emergency IS NULL THEN 1 ELSE 0 END) AS emergency_nulls,
  SUM(CASE WHEN medical_specialty IS NULL THEN 1 ELSE 0 END) AS specialty_nulls,
  SUM(CASE WHEN diag_1 IS NULL THEN 1 ELSE 0 END) AS diag1_nulls,
  SUM(CASE WHEN diag_2 IS NULL THEN 1 ELSE 0 END) AS diag2_nulls,
  SUM(CASE WHEN diag_3 IS NULL THEN 1 ELSE 0 END) AS diag3_nulls,
  SUM(CASE WHEN glucose_test IS NULL THEN 1 ELSE 0 END) AS glucose_nulls,
  SUM(CASE WHEN A1Ctest IS NULL THEN 1 ELSE 0 END) AS a1c_nulls,
  SUM(CASE WHEN `change` IS NULL THEN 1 ELSE 0 END) AS change_nulls,
  SUM(CASE WHEN diabetes_med IS NULL THEN 1 ELSE 0 END) AS diabetes_med_nulls,
  SUM(CASE WHEN readmitted IS NULL THEN 1 ELSE 0 END) AS readmitted_nulls
FROM hospital_analysis;

  # check all from column medical_specilaity 
SELECT medical_specialty, COUNT(*) AS total
FROM hospital_analysis
GROUP BY medical_specialty
ORDER BY total DESC;

-- Now missing is 12382, so lets see % 
select medical_specialty , count(*) as count , ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hospital_analysis), 2) AS percentage
from hospital_analysis group by medical_specialty order by count desc;

-- output of % is 49.53

-- only checking missing valye of medical specialty
SELECT 
  COUNT(*) AS missing_count
FROM hospital_analysis
WHERE medical_specialty = 'Missing';

-- Compare Missing vs Others
SELECT
  SUM(CASE WHEN medical_specialty = 'Missing' THEN 1 ELSE 0 END) AS missing,
  SUM(CASE WHEN medical_specialty = 'Other' THEN 1 ELSE 0 END) AS other,
  SUM(CASE WHEN medical_specialty NOT IN ('Missing','Other') THEN 1 ELSE 0 END) AS known_specialty
FROM hospital_analysis;

-- missing/ not in readmission
SELECT readmitted,
       SUM(CASE WHEN medical_specialty = 'Missing' THEN 1 ELSE 0 END) AS missing_count
FROM hospital_analysis
GROUP BY readmitted;


-- check duplicates 
SELECT 
  COUNT(*) AS total_rows,
  COUNT(*) - COUNT(DISTINCT CONCAT_WS('|', age, time_in_hospital, n_lab_procedures, n_procedures, n_medications, n_outpatient, n_inpatient,
  n_emergency, medical_specialty, diag_1, diag_2, diag_3, glucose_test, A1Ctest, `change`, diabetes_med, readmitted)) AS duplicate_rows
FROM hospital_analysis;

-- categorial columns 
select medical_specialty, count(*) as total from hospital_analysis  group by medical_specialty order by total;

select  glucose_test, count(*) as total from hospital_analysis group by  glucose_test order by total;

select diabetes_med, count(*) as total from hospital_analysis group by diabetes_med order by total;

select readmitted, count(*) as total from hospital_analysis group by readmitted order by total;

-- numerical 
select time_in_hospital , count(*) as total from hospital_analysis group by time_in_hospital order by total desc;
select n_lab_procedures, count(*) as total from hospital_analysis group by n_lab_procedures order by total desc;
select n_medications, count(*) as total from hospital_analysis group by n_medications order by total desc;
select n_outpatient, count(*) as total from hospital_analysis group by n_outpatient order by total desc;
select n_inpatient, count(*) as total from hospital_analysis group by n_inpatient order by total desc;
select n_emergency, count(*) as total from hospital_analysis group by n_emergency order by total desc;

-- ordinal categorical 
SELECT age, COUNT(*) AS total FROM hospital_analysis GROUP BY age ORDER BY age;

-- Target variable 
SELECT readmitted, COUNT(*) AS total FROM hospital_analysis GROUP BY readmitted;

-- Readmission rate analysis 
-- Which group has higher readmission risk?

select medical_specialty, count(*)  as total_patients , 
sum(case when readmitted = 'yes' then 1 else 0 end) as readmitted_count, 
round(sum(case when readmitted = 'yes' then 1 else 0 end )* 100.0 /count(*) ,2) as readmission_rate from hospital_analysis 
group by medical_specialty order by readmission_rate desc;


-- By Age Group 

select medical_specialty, count(*) as total_patients, 
sum(case when readmitted = 'yes' then 1 else 0 end ) as readmitted_count , 
round(sum(case when readmitted = 'yes' then 1 else 0 end )*100.0 /count(*),2) as readmission_rate from hospital_analysis
group by age order by age;

-- Average values per group
-- hospital stay vs readmission
select readmitted, avg(time_in_hospital) as avg_stay, avg(n_medications) as avg_meds, 
avg(n_lab_procedures) as avg_labs from hospital_analysis group by readmitted;

-- high usage patients

select 
case when n_inpatient >= 2 then 'high patient' else 'low inpatient' end as inpatient_group , 
count(*) as total, sum(case when readmitted = 'yes' then 1 else 0 end) as readmitted_count from hospital_analysis
group by inpatient_group;

-- EMERGENCY / UTILIZATION ANALYSIS
-- n_emergency, n_inpatient, n_outpatient
-- Do frequent hospital visitors get readmitted more?

select n_emergency, count(*) as total, sum(case when readmitted = 'yes' then 1 else 0 end ) 
as readmitted_count from hospital_analysis group by n_emergency order by n_emergency desc;

select n_inpatient , count(*) as total, sum(case when readmitted = 'yes' then 1 else 0 end ) 
as readmitted_count from hospital_analysis group by n_inpatient order by n_inpatient  desc;

select n_outpatient , count(*) as total, sum(case when readmitted = 'yes' then 1 else 0 end ) 
as readmitted_count from hospital_analysis group by n_outpatient order by n_outpatient  desc;


-- glucose_test, A1Ctest 
-- Do test results relate to readmission?
select  glucose_test , count(*) as total , 
round(sum(case when readmitted = 'yes' then 1 else 0 end ) *100.0 /count(*) ,2) as readmission_rate
from hospital_analysis group by  glucose_test ;

select A1Ctest, count(*) as total, 
round(sum(case when readmitted = 'yes' then 1 else 0 end) * 100.0/ count(*) ,2) as readmission_rate 
from hospital_analysis group by A1Ctest;






