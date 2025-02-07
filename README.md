
DB shema 
table for task;

CREATE TABLE tasks (
    id varchar(255) PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255),
    description TEXT,
    help_text TEXT,
    input_format JSON,
    output_format JSON,
    dependent_task_slug VARCHAR(255),
    repeats_on INT,
    bulk_input BOOLEAN,
    input_http_method TINYINT,
    api_endpoint TEXT,
    api_timeout_in_ms INT,
    response_type TINYINT,
    is_json_input_needed BOOLEAN,
    task_type TINYINT,
    is_active BOOLEAN,
    is_optional BOOLEAN,
    eta JSON,
    service_id INT,
    email_list TEXT,
    action VARCHAR(50)
);

table for reactflow instance;
create table state(
 id varchar(255) primary key,
 viewport json,
 metadata json,
 nodes json,
 edges json
);

