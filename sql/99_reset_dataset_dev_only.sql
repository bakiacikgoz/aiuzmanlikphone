-- AI Engineering Academy Dataset v1 reset helper
-- Removes generated content rows. Run only in development/staging.
begin;

delete from public.content_embeddings where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.content_reviews where comment like 'Seed içerik onayı:%';
delete from public.season_rewards where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.league_groups where season_id in (select id from public.league_seasons where metadata->>'seed_pack' = 'ai-eng-academy-v1');
delete from public.league_seasons where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.certificate_templates where slug in ('course-completion-v1','capstone-expert-v1');
delete from public.rewards where slug in ('daily-goal-xp','streak-freeze','certificate-unlock');
delete from public.badges where slug in ('neural-network-apprentice','rag-builder','mlops-operator','capstone-certified');
delete from public.lab_test_cases where lab_id in (select id from public.labs where metadata->>'seed_pack' = 'ai-eng-academy-v1');
delete from public.lab_parameters where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.labs where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.assessment_options where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.assessment_questions where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.assessments where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.glossary_terms where id in ('99fd6ae7-0f73-599b-a5ee-6e3da4bb6da0', 'f7cd4a51-d062-5efd-abfe-a1d5f320c6e0', '9095c819-b573-5991-89e6-c4fec5e0241c', '3b121123-5ce0-58ab-a502-26f844ec96ec', 'b79fc394-3ff4-5f3c-ba58-e3dc3ebb4837', '46f47218-4476-5472-9d64-6094c4307abc', 'c681db7e-ca24-52ff-a788-10360d122468', '2f8e5c78-da39-5341-9fe4-146389fe220c', 'b048bf1b-ac00-5a52-88e1-1ba311eedc71', '9ab460c6-6e2b-584f-8bbc-26c7e7432703', '5e2c3ed4-a090-5c6d-8bd8-98903af07279', '6f34d97b-490a-503d-aab7-a2092493fe52', '69ea99df-5cdc-53d6-be21-5dafd914cc15', 'e1e5fd32-1a37-5f13-9ca0-c37e95a91fbb', '9683fc3b-a34a-5d6c-a824-ab05e490be90', '3bccb4c1-c56a-57e4-89c1-8dc66cb7cbe9', 'ce5c29a0-a885-5516-9e87-5fbf5447d721', 'd9a10b25-8bd5-5d70-a99a-ee8aa0553f67', 'f436f253-ceb8-54ac-867f-5c4628e2f806', 'b4499937-ad56-508f-b4f5-df825fd76aaa', 'ad09426f-dd5f-5262-8700-79c5891b3f73', '451e4d73-9d39-5c02-bd79-a771d3a917c9', '259606cf-e03e-5d5c-ae8b-26b8c9133ea4', '7729871d-d4bc-5ee9-92ad-1734f8393931', '77a8e3aa-d33a-58d7-881b-3dc16aba8a8f', 'bc864c86-1e7a-5bf7-8894-fc2db9fb5ee8', '1298eabb-afbb-5715-a098-bd0d3dab7cef', '34d8f611-762d-56d7-a41c-896d6c7058d5', '050543c2-15a5-57e3-acc1-b264b896dab0', 'b80995bb-ce74-56b5-8940-a77f6fbbf9dd');
delete from public.lesson_resources where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.lesson_content_blocks where data->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.lessons where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.modules where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.course_prerequisites where course_id in (select id from public.courses where metadata->>'seed_pack' = 'ai-eng-academy-v1');
delete from public.course_skills where course_id in (select id from public.courses where metadata->>'seed_pack' = 'ai-eng-academy-v1');
delete from public.courses where metadata->>'seed_pack' = 'ai-eng-academy-v1';
delete from public.learning_path_skills where path_id in (select id from public.learning_paths where metadata->>'seed_pack' = 'ai-eng-academy-v1');
delete from public.learning_paths where metadata->>'seed_pack' = 'ai-eng-academy-v1';
commit;
