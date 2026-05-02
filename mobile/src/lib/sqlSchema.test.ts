import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const schema = readFileSync(decodeURIComponent(new URL('../../../sql/00_schema.sql', import.meta.url).pathname), 'utf8');

describe('Supabase schema safety checks', () => {
  it('keeps catalog path lesson counts and required mobile RPC wrappers', () => {
    expect(schema).toContain('count(distinct l.id)::integer as lesson_count');
    expect(schema).toContain('create or replace function public.submit_placement(');
    expect(schema).toContain('create or replace function public.save_interests(');
    expect(schema).toContain('create or replace function public.submit_quiz_answer(');
    expect(schema).toContain('create or replace function public.submit_lab_submission(');
    expect(schema).toContain('create or replace function public.issue_certificate(');
  });

  it('does not expose correct answers or lab solution code through safe views', () => {
    const optionsView = schema.match(/create or replace view public\.v_assessment_options_safe as([\s\S]*?)create or replace view public\.v_labs_safe as/)?.[1] ?? '';
    const labsView = schema.match(/create or replace view public\.v_labs_safe as([\s\S]*?)create or replace view public\.v_my_dashboard as/)?.[1] ?? '';

    expect(optionsView).not.toContain('is_correct');
    expect(labsView).not.toContain('solution_code');
  });

  it('declares policy tables for subscriptions, reports and account deletion requests', () => {
    expect(schema).toContain('create table if not exists public.user_subscriptions');
    expect(schema).toContain('create table if not exists public.ai_mentor_reports');
    expect(schema).toContain('create table if not exists public.account_deletion_requests');
    expect(schema).toContain('drop policy if exists');
  });

  it('keeps rerunnable subscription columns and mentor report foreign keys in safe order', () => {
    expect(schema).toContain('alter table public.plans add column if not exists provider_product_id text');
    expect(schema).toContain('alter table public.plans add column if not exists provider_base_plan_id text');
    expect(schema).toContain("alter table public.plans add column if not exists entitlement text not null default 'free'");
    expect(schema.indexOf('create table if not exists public.ai_mentor_messages')).toBeLessThan(
      schema.indexOf('create table if not exists public.ai_mentor_reports'),
    );
  });
});
