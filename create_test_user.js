const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = 'https://jedopindhnwvvfbdtnii.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZG9waW5kaG53dnZmYmR0bmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0MzMwOSwiZXhwIjoyMDkwMDE5MzA5fQ.loTjweq-_pcB9XId4AqvPr4713q2DrHVBHbrUBJZfgo';

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔐 Password: TestPassword123!');
    console.log('👤 User ID:', data.user.id);
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

main();
