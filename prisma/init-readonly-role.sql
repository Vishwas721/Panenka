-- Create a read-only role for the MCP server
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'panenka_readonly') THEN
    CREATE ROLE panenka_readonly WITH LOGIN PASSWORD 'panenka_readonly_password';
  END IF;
END
$$;

-- Grant read-only access to all existing and future tables
GRANT CONNECT ON DATABASE panenka_dev TO panenka_readonly;
GRANT USAGE ON SCHEMA public TO panenka_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO panenka_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO panenka_readonly;
