\echo 'Delete and recreate db for appointment-booker'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE appointment_booker;
CREATE DATABASE appointment_booker;
\connect appointment_booker

\i appointment-booker-schema.sql

\echo 'Delete and recreate test db for appointment-booker'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE appointment_booker_test;
CREATE DATABASE appointment_booker_test;
\connect appointment_booker_test    

\i appointment-booker-schema.sql