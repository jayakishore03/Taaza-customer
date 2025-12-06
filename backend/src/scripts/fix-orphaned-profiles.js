/**
 * Fix Orphaned Profiles
 * Finds and cleans up profiles that exist without corresponding users
 */

import { supabase, supabaseAdmin } from '../config/database.js';

async function findOrphanedProfiles() {
  console.log('========================================');
  console.log('🔍 FINDING ORPHANED PROFILES');
  console.log('========================================');
  console.log('');

  try {
    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, phone, email');

    if (profileError) {
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No profiles found in database.');
      return [];
    }

    console.log(`📊 Found ${profiles.length} profiles in user_profiles table`);
    console.log('');

    // Check which profiles don't have corresponding users
    const orphaned = [];

    for (const profile of profiles) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', profile.id)
        .single();

      if (!user) {
        orphaned.push(profile);
      }
    }

    if (orphaned.length === 0) {
      console.log('✅ No orphaned profiles found!');
      console.log('All profiles have corresponding users.');
      console.log('');
      return [];
    }

    console.log(`⚠️  Found ${orphaned.length} orphaned profiles:`);
    console.log('');
    orphaned.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name || 'Unknown'}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Phone: ${profile.phone || 'None'}`);
      console.log(`   Email: ${profile.email || 'None'}`);
      console.log('');
    });

    return orphaned;

  } catch (error) {
    console.error('❌ Error finding orphaned profiles:', error);
    throw error;
  }
}

async function cleanupOrphanedProfiles(orphaned) {
  if (orphaned.length === 0) {
    return;
  }

  console.log('========================================');
  console.log('🧹 CLEANING UP ORPHANED PROFILES');
  console.log('========================================');
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const profile of orphaned) {
    try {
      console.log(`Cleaning up: ${profile.name} (${profile.phone || profile.email})`);

      // Delete related data
      await supabaseAdmin.from('addresses').delete().eq('user_id', profile.id);
      await supabaseAdmin.from('orders').delete().eq('user_id', profile.id);
      await supabaseAdmin.from('login_sessions').delete().eq('user_id', profile.id);
      await supabaseAdmin.from('activity_logs').delete().eq('user_id', profile.id);

      // Delete the profile
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      console.log(`✅ Cleaned up successfully`);
      console.log('');
      successCount++;

    } catch (error) {
      console.error(`❌ Error cleaning up ${profile.name}:`, error.message);
      console.log('');
      errorCount++;
    }
  }

  console.log('========================================');
  console.log('📊 CLEANUP SUMMARY');
  console.log('========================================');
  console.log(`✅ Successfully cleaned: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Failed to clean: ${errorCount}`);
  }
  console.log('');
}

async function verifyCleanup() {
  console.log('========================================');
  console.log('✅ VERIFICATION');
  console.log('========================================');
  console.log('');

  // Count users and profiles
  const { data: users } = await supabase.from('users').select('id');
  const { data: profiles } = await supabase.from('user_profiles').select('id');

  const userCount = users?.length || 0;
  const profileCount = profiles?.length || 0;

  console.log(`Users in database: ${userCount}`);
  console.log(`Profiles in database: ${profileCount}`);
  console.log('');

  if (userCount === profileCount) {
    console.log('✅ PERFECT! Users and profiles are in sync.');
  } else {
    console.log('⚠️  WARNING: User and profile counts do not match.');
    console.log('   Some inconsistency may still exist.');
  }
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--fix');
  const skipConfirm = args.includes('--yes');

  try {
    // Step 1: Find orphaned profiles
    const orphaned = await findOrphanedProfiles();

    if (orphaned.length === 0) {
      console.log('========================================');
      console.log('✅ ALL DONE!');
      console.log('========================================');
      console.log('No orphaned profiles found.');
      console.log('Your database is clean and consistent.');
      console.log('');
      process.exit(0);
    }

    // Step 2: Ask for confirmation or fix automatically
    if (!autoFix && !skipConfirm) {
      console.log('========================================');
      console.log('⚠️  ACTION REQUIRED');
      console.log('========================================');
      console.log('');
      console.log('To clean up orphaned profiles, run:');
      console.log('  node src/scripts/fix-orphaned-profiles.js --fix --yes');
      console.log('');
      console.log('To just check (without fixing):');
      console.log('  node src/scripts/fix-orphaned-profiles.js');
      console.log('');
      process.exit(0);
    }

    if (autoFix && !skipConfirm) {
      console.log('⚠️  Add --yes flag to confirm cleanup:');
      console.log('  node src/scripts/fix-orphaned-profiles.js --fix --yes');
      console.log('');
      process.exit(0);
    }

    // Step 3: Clean up
    await cleanupOrphanedProfiles(orphaned);

    // Step 4: Verify
    await verifyCleanup();

    console.log('========================================');
    console.log('✅ CLEANUP COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Users can now sign up with these phone numbers/emails.');
    console.log('No more "already in use" errors for orphaned data.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERROR');
    console.error('========================================');
    console.error('');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

main();

