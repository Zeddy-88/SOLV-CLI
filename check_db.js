const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  const supabaseUrl = 'https://jedopindhnwvvfbdtnii.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZG9waW5kaG53dnZmYmR0bmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ0MzMwOSwiZXhwIjoyMDkwMDE5MzA5fQ.loTjweq-_pcB9XId4AqvPr4713q2DrHVBHbrUBJZfgo';

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🔍 Checking Supabase connection...\n');

    // 1. 사용자 확인
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Auth error:', usersError.message);
      return;
    }
    console.log('✅ Auth users:');
    users.users.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u.id})`);
    });

    // 2. 분석 레코드 확인
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('*');
    
    if (analysesError) {
      console.error('❌ Database error:', analysesError.message);
      return;
    }
    
    console.log(`\n✅ Analysis records (${analyses.length} total):`);
    analyses.forEach(a => {
      console.log(`   - ID: ${a.id}`);
      console.log(`     Company: ${a.company_name || 'N/A'}`);
      console.log(`     Status: ${a.status}`);
      console.log(`     Created: ${new Date(a.created_at).toLocaleString('ko-KR')}`);
    });

    // 3. Storage 확인
    console.log('\n🔍 Checking Storage...');
    const { data: files, error: storageError } = await supabase.storage
      .from('reports')
      .list();
    
    if (storageError) {
      console.error('❌ Storage error:', storageError.message);
      return;
    }
    
    console.log(`✅ Storage files (${files.length} total):`);
    files.slice(0, 5).forEach(f => {
      console.log(`   - ${f.name}`);
    });

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkDatabase();
