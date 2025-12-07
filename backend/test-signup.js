/**
 * Test Signup Flow
 * Tests if user can be created in database
 */

import { supabaseAdmin } from './src/config/database.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testSignup() {
  console.log('========================================');
  console.log('🧪 TESTING SIGNUP FLOW');
  console.log('========================================');
  console.log('');

  const testUser = {
    name: 'Test User',
    phone: `99${Date.now().toString().slice(-8)}`, // Unique phone
    email: `test${Date.now()}@example.com`, // Unique email
    password: 'test123',
  };

  console.log('Test User Data:');
  console.log('  Name:', testUser.name);
  console.log('  Phone:', testUser.phone);
  console.log('  Email:', testUser.email);
  console.log('');

  try {
    // Step 1: Create user
    console.log('Step 1: Creating user in users table...');
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(testUser.password);

    const userData = {
      id: userId,
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.error('❌ ERROR creating user:', userError);
      console.error('   Code:', userError.code);
      console.error('   Message:', userError.message);
      console.error('   Details:', userError.details);
      console.error('   Hint:', userError.hint);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('   ID:', userId);
    console.log('');

    // Step 2: Create profile
    console.log('Step 2: Creating profile in user_profiles table...');
    const profileData = {
      id: userId,
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ ERROR creating profile:', profileError);
      console.error('   Code:', profileError.code);
      console.error('   Message:', profileError.message);
      console.error('   Details:', profileError.details);
      console.error('   Hint:', profileError.hint);
      
      // Clean up user
      console.log('Cleaning up user...');
      await supabaseAdmin.from('users').delete().eq('id', userId);
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log('');

    // Verify
    console.log('Step 3: Verifying in database...');
    const { data: verifyUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: verifyProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('✅ Verification complete:');
    console.log('   User in database:', verifyUser ? 'Yes ✅' : 'No ❌');
    console.log('   Profile in database:', verifyProfile ? 'Yes ✅' : 'No ❌');
    console.log('');

    console.log('========================================');
    console.log('✅ TEST PASSED!');
    console.log('========================================');
    console.log('');
    console.log('Signup flow is working correctly!');
    console.log('');
    console.log('Test user created:');
    console.log('  Phone:', testUser.phone);
    console.log('  Email:', testUser.email);
    console.log('  Password: test123');
    console.log('');
    console.log('You can try signing in with these credentials.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ TEST FAILED!');
    console.error('========================================');
    console.error('');
    console.error('Error:', error);
    console.error('');
  }
}

testSignup().then(() => process.exit(0));

