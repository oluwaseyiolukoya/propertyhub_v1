--

CREATE INDEX "subscription_events_createdAt_idx" ON public.subscription_events USING btree ("createdAt");


--
-- Name: subscription_events_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "subscription_events_customerId_idx" ON public.subscription_events USING btree ("customerId");


--
-- Name: subscription_events_eventType_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "subscription_events_eventType_idx" ON public.subscription_events USING btree ("eventType");


--
-- Name: support_tickets_ticketNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "support_tickets_ticketNumber_key" ON public.support_tickets USING btree ("ticketNumber");


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: trial_notifications_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "trial_notifications_customerId_idx" ON public.trial_notifications USING btree ("customerId");


--
-- Name: trial_notifications_notificationType_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "trial_notifications_notificationType_idx" ON public.trial_notifications USING btree ("notificationType");


--
-- Name: trial_notifications_sentAt_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "trial_notifications_sentAt_idx" ON public.trial_notifications USING btree ("sentAt");


--
-- Name: units_propertyId_unitNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "units_propertyId_unitNumber_key" ON public.units USING btree ("propertyId", "unitNumber");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: activity_logs activity_logs_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_users customer_users_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT "customer_users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_users customer_users_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.customer_users
    ADD CONSTRAINT "customer_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenses expenses_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expenses expenses_recordedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: expenses expenses_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leases leases_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leases leases_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leases leases_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT "leases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_requests maintenance_requests_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT "maintenance_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_requests maintenance_requests_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT "maintenance_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_requests maintenance_requests_reportedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT "maintenance_requests_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_requests maintenance_requests_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT "maintenance_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_updates maintenance_updates_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_updates
    ADD CONSTRAINT "maintenance_updates_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.maintenance_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_updates maintenance_updates_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.maintenance_updates
    ADD CONSTRAINT "maintenance_updates_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: mrr_snapshots mrr_snapshots_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.mrr_snapshots
    ADD CONSTRAINT "mrr_snapshots_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: onboarding_applications onboarding_applications_activatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.onboarding_applications
    ADD CONSTRAINT "onboarding_applications_activatedBy_fkey" FOREIGN KEY ("activatedBy") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onboarding_applications onboarding_applications_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.onboarding_applications
    ADD CONSTRAINT "onboarding_applications_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onboarding_applications onboarding_applications_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.onboarding_applications
    ADD CONSTRAINT "onboarding_applications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onboarding_applications onboarding_applications_reviewedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.onboarding_applications
    ADD CONSTRAINT "onboarding_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onboarding_applications onboarding_applications_selectedPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.onboarding_applications
    ADD CONSTRAINT "onboarding_applications_selectedPlanId_fkey" FOREIGN KEY ("selectedPlanId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_methods payment_methods_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT "payment_methods_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT "payment_methods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_settings payment_settings_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT "payment_settings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_leaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES public.leases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_paymentMethodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES public.payment_methods(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: properties properties_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT "properties_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: properties properties_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT "properties_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: property_key_transactions property_key_transactions_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_key_transactions
    ADD CONSTRAINT "property_key_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_key_transactions property_key_transactions_keyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_key_transactions
    ADD CONSTRAINT "property_key_transactions_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES public.property_keys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_key_transactions property_key_transactions_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_key_transactions
    ADD CONSTRAINT "property_key_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_key_transactions property_key_transactions_performedForUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_key_transactions
    ADD CONSTRAINT "property_key_transactions_performedForUserId_fkey" FOREIGN KEY ("performedForUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_keys property_keys_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_keys property_keys_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_keys property_keys_issuedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_keys property_keys_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: property_keys property_keys_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_keys property_keys_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_keys
    ADD CONSTRAINT "property_keys_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: property_managers property_managers_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_managers
    ADD CONSTRAINT "property_managers_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: property_managers property_managers_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.property_managers
    ADD CONSTRAINT "property_managers_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refunds refunds_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "refunds_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_events subscription_events_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT "subscription_events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trial_notifications trial_notifications_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.trial_notifications
    ADD CONSTRAINT "trial_notifications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: units units_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public.properties(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: doadmin
--

ALTER DEFAULT PRIVILEGES FOR ROLE doadmin IN SCHEMA public GRANT ALL ON SEQUENCES TO contrezz_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: doadmin
--

ALTER DEFAULT PRIVILEGES FOR ROLE doadmin IN SCHEMA public GRANT ALL ON FUNCTIONS TO contrezz_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: doadmin
--

ALTER DEFAULT PRIVILEGES FOR ROLE doadmin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO contrezz_user;


--
-- PostgreSQL database dump complete
--

apps@backend-5b7469b6d7-d7jhr:/tmp$ cd /tmp
apps@backend-5b7469b6d7-d7jhr:/tmp$ pg_dump "$DATABASE_URL" --data-only --inserts -f production_data.sql
apps@backend-5b7469b6d7-d7jhr:/tmp$ wc -l production_data.sql
263 production_data.sql
apps@backend-5b7469b6d7-d7jhr:/tmp$ cat /tmp/production_data.sql
--
-- PostgreSQL database dump
--

-- Dumped from database version 15.14
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg22.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public._prisma_migrations VALUES ('94600394-b4af-4471-b9c3-f00e4f32ff64', '5682b023509a6377435286af32add54fb75763fb3b5316d25d79f9eebf0ad28f', NULL, '20251108_add_onboarding_applications', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20251108_add_onboarding_applications

Database error code: 42P01

Database error:
ERROR: relation "admins" does not exist

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \"admins\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(433), routine: Some("RangeVarGetRelidExtended") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20251108_add_onboarding_applications"
             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106
   1: schema_core::commands::apply_migrations::Applying migration
           with migration_name="20251108_add_onboarding_applications"
             at schema-engine/core/src/commands/apply_migrations.rs:91
   2: schema_core::state::ApplyMigrations
             at schema-engine/core/src/state.rs:226', '2025-11-09 22:45:47.257756+00', '2025-11-09 22:44:03.66888+00', 0);
INSERT INTO public._prisma_migrations VALUES ('5b026bbc-1c29-4922-a851-bb0556bb90bb', '5682b023509a6377435286af32add54fb75763fb3b5316d25d79f9eebf0ad28f', '2025-11-09 22:46:15.447749+00', '20251108_add_onboarding_applications', '', NULL, '2025-11-09 22:46:15.447749+00', 0);
INSERT INTO public._prisma_migrations VALUES ('123b8570-b842-4acd-9190-2c9d9c834c6f', '2f313c213e40566d85960da3a9166a5431197092762c73d7b82959c29ce0522a', '2025-11-16 14:58:21.104988+00', '20251109190000_add_missing_customer_plan_fields', NULL, NULL, '2025-11-16 14:58:21.08079+00', 1);
INSERT INTO public._prisma_migrations VALUES ('2d900f84-96ad-4f3e-b176-6bc211ab9b91', '488a5cf4341ee1d657b064e95ec90ee3095a0754c33559878558c70de9142ba0', '2025-11-16 14:58:21.121363+00', '20251116132708_add_missing_customer_plan_fields', NULL, NULL, '2025-11-16 14:58:21.109658+00', 1);


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.plans VALUES ('plan-starter-1', 'Starter', 'Perfect for small property owners', 500, 5000, 'NGN', 5, 3, 1000, '["Up to 5 properties", "Up to 3 users", "1GB storage", "Basic reporting", "Email support"]', true, false, NULL, '2025-11-09 22:46:18.854', '2025-11-09 22:46:18.852', 'property_management', NULL);
INSERT INTO public.plans VALUES ('plan-professional-1', 'Professional', 'For growing property portfolios', 1200, 12000, 'NGN', 20, 10, 5000, '["Up to 20 properties", "Up to 10 users", "5GB storage", "Advanced reporting", "Priority support", "Custom branding"]', true, true, NULL, '2025-11-09 22:46:19.774', '2025-11-09 22:46:19.772', 'property_management', NULL);
INSERT INTO public.plans VALUES ('plan-enterprise-1', 'Enterprise', 'For large property management companies', 2500, 25000, 'NGN', 100, 50, 20000, '["Up to 100 properties", "Up to 50 users", "20GB storage", "Enterprise reporting", "Dedicated support", "Custom branding", "API access", "White-label options"]', true, false, NULL, '2025-11-09 22:46:20.343', '2025-11-09 22:46:20.342', 'property_management', NULL);
INSERT INTO public.plans VALUES ('cb6d91a7-c6c6-4ac1-8fc2-a04a867bafeb', 'Developer Starter', 'Perfect for small development projects and individual developers', 49.99, 499.99, 'USD', NULL, 3, 5000, '["Up to 3 active projects", "3 team members", "5GB storage", "Project management dashboard", "Budget tracking", "Expense management", "Vendor management", "Basic reporting", "Email support"]', true, false, 14, '2025-11-16 15:58:50.983', '2025-11-16 15:58:50.983', 'development', 3);
INSERT INTO public.plans VALUES ('5bb6ae80-f1b0-4cb8-92ed-973ac0ff9ca3', 'Developer Professional', 'For growing development companies with multiple projects', 149.99, 1499.99, 'USD', NULL, 10, 20000, '["Up to 10 active projects", "10 team members", "20GB storage", "Advanced project management", "Budget vs actual tracking", "Expense management", "Vendor management", "Purchase order management", "Project funding tracking", "Advanced reporting & analytics", "Custom reports", "Priority email support", "Phone support"]', true, true, 14, '2025-11-16 15:58:50.996', '2025-11-16 15:58:50.996', 'development', 10);
INSERT INTO public.plans VALUES ('792b5f3b-21aa-4ba8-9f54-1a2129660697', 'Developer Enterprise', 'For large development companies with unlimited projects', 399.99, 3999.99, 'USD', NULL, 999, 100000, '["Unlimited projects", "Unlimited team members", "100GB storage", "Enterprise project management", "Advanced budget tracking", "Expense management", "Vendor management", "Purchase order management", "Project funding tracking", "Multi-project reporting", "Custom dashboards", "API access", "White-label options", "Dedicated account manager", "24/7 priority support", "Custom integrations", "Training & onboarding"]', true, false, 30, '2025-11-16 15:58:51.005', '2025-11-16 15:58:51.005', 'development', 999);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.customers VALUES ('customer-1', 'Metro Properties LLC', 'John Smith', 'john@metro-properties.com', '+234-800-1234567', 'https://metro-properties.com', 'TAX-12345678', 'Real Estate', '10-50', 'plan-professional-1', 'monthly', 1200, NULL, '2025-11-09 22:46:20.937', 'active', NULL, 20, 10, 5000, '123 Lagos Street', 'Lagos', 'Lagos', '100001', 'Nigeria', '2025-11-09 22:46:20.939', '2025-11-09 22:46:20.937', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0);
INSERT INTO public.customers VALUES ('b5936565-dac1-4be5-b992-89d88ca536cc', 'ABC Enterprise', 'Enoch  Adeleke', 'olukoyaseyifunmi@gmail.com', '01727141663', NULL, NULL, NULL, NULL, 'cb6d91a7-c6c6-4ac1-8fc2-a04a867bafeb', 'monthly', 49.99, NULL, '2025-11-16 16:04:25.44', 'active', NULL, 0, 3, 5000, NULL, 'Ibadan', 'Lagos', NULL, 'Nigeria', '2025-11-16 16:01:24.106', '2025-11-16 16:01:24.105', 3, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'development', 3, 3);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.users VALUES ('user-owner-1', 'customer-1', 'John Smith', 'john@metro-properties.com', '$2a$10$g30kZLlyuBlOss2h043kxuAfY2P6xiSocSShjFB/8xdhvpFRKy71m', '+234-800-1234567', 'owner', NULL, 'Metro Properties LLC', 'USD', true, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:21.944', '2025-11-09 22:46:21.943');
INSERT INTO public.users VALUES ('user-manager-1', 'customer-1', 'Mary Johnson', 'manager@metro-properties.com', '$2a$10$2M/4oudlZFKU.I7XvN.3POGQLbNRsjvdOk6oNghj0qOiHLR8SOQCu', '+234-800-9876543', 'manager', NULL, 'Metro Properties LLC', 'NGN', true, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:22.993', '2025-11-09 22:46:22.993');
INSERT INTO public.users VALUES ('user-tenant-1', 'customer-1', 'Ade Akin', 'tenant1@metro-properties.com', '$2a$10$9e.u.sV60O7TnWTd1CfR3OPjANqUNeXNx0KtSS9R5h0ajPKiWIa46', '+234-801-1111111', 'tenant', NULL, NULL, 'NGN', true, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:23.677', '2025-11-09 22:46:23.677');
INSERT INTO public.users VALUES ('user-tenant-2', 'customer-1', 'Ngozi Chukwu', 'tenant2@metro-properties.com', '$2a$10$zsdbpBxPgXL9AbT7XBhZ6.XDsNEK9UQYrXfMTm22nNlAUbEv60CAS', '+234-801-2222222', 'tenant', NULL, NULL, 'NGN', true, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:24.557', '2025-11-09 22:46:24.557');
INSERT INTO public.users VALUES ('02bf2cc2-b7e2-41b3-a138-ddbc56d1e9b2', NULL, 'Oyinade Olukoya', 'oyinadeo@contrezz.com', NULL, '08063223929', 'Admin', 'Admin', 'Contrezz', 'USD', true, 'active', NULL, '2025-11-11 17:43:19.053', NULL, '["customer_management", "customer_create", "customer_edit", "customer_delete", "customer_view", "user_management", "user_create", "user_edit", "user_delete", "user_view", "role_management", "role_create", "role_edit", "role_delete", "billing_management", "plan_management", "invoice_management", "payment_view", "analytics_view", "analytics_reports", "analytics_export", "system_health", "platform_settings", "support_tickets", "support_view", "support_respond", "support_close", "activity_logs", "audit_reports"]', NULL, '2025-11-11 17:43:19.055', '2025-11-11 17:43:45.633');
INSERT INTO public.users VALUES ('d8a19f56-3c02-4aed-b795-06a6f87cda71', 'b5936565-dac1-4be5-b992-89d88ca536cc', 'Enoch  Adeleke', 'olukoyaseyifunmi@gmail.com', '$2a$10$heGPiiQHdrGtop2ekw4jEuIYvQ2YsY0GMTrSymW9lzysYF.kcwL02', '01727141663', 'developer', NULL, NULL, 'USD', true, 'active', '2025-11-16 16:04:32.106', '2025-11-16 16:01:24.289', NULL, NULL, NULL, '2025-11-16 16:01:24.29', '2025-11-16 16:04:32.107');
INSERT INTO public.users VALUES ('086ff1e8-4b33-43b8-abf2-846c3279898a', NULL, 'Taiwo Owoniyi', 'taiwoo@contrezz.com', '$2a$10$1EdCXHUJD3ghWzf2T.gh3.YZESIL9otys6LI2xy62y0R5REhZvi7.', '09130271940', 'Admin', 'Admin', 'Contrezz Admin', 'USD', true, 'active', '2025-11-13 09:22:19.134', '2025-11-10 16:18:24.77', NULL, '["customer_management", "customer_create", "customer_edit", "customer_delete", "customer_view", "user_management", "user_create", "user_edit", "user_delete", "user_view", "role_management", "role_create", "role_edit", "role_delete", "billing_management", "plan_management", "invoice_management", "payment_view", "analytics_view", "analytics_reports", "analytics_export", "system_health", "platform_settings", "support_tickets", "support_view", "support_respond", "support_close", "activity_logs", "audit_reports"]', NULL, '2025-11-10 16:18:24.772', '2025-11-13 09:22:19.135');


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.activity_logs VALUES ('00704c1a-d811-4f05-9e90-e33e61490218', 'b5936565-dac1-4be5-b992-89d88ca536cc', 'd8a19f56-3c02-4aed-b795-06a6f87cda71', 'CUSTOMER_CREATED', 'Customer', 'b5936565-dac1-4be5-b992-89d88ca536cc', 'Customer ABC Enterprise created by admin@contrezz.com', NULL, NULL, NULL, '2025-11-16 16:01:24.31');


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.admins VALUES ('admin-1', 'admin@contrezz.com', '$2a$10$pGbI13okwDw3ZrK1LESJI.v3YkvQzbYhwE1OP/qlhM85gu2lkfcBW', 'Super Admin', 'super_admin', true, '2025-11-09 22:46:17.953', '2025-11-09 22:46:17.226', '2025-11-16 10:44:55.795');


--
-- Data for Name: customer_users; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.properties VALUES ('prop-metro-1', 'customer-1', 'user-owner-1', 'Metro Garden Apartments', 'Apartment', '45 Admiralty Way', 'Lagos', 'Lagos', '105102', 'Nigeria', NULL, 3, 3, NULL, NULL, NULL, 'NGN', NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Modern apartments in Lekki Phase 1', NULL, '2025-11-09 22:46:25.188', '2025-11-09 22:46:25.188', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.units VALUES ('unit-metro-a1', 'prop-metro-1', 'A1', '2 Bedroom', 1, 2, 2, 90, 350000, 350000, 'occupied', NULL, NULL, '2025-11-09 22:46:27.088', '2025-11-09 22:46:27.088');
INSERT INTO public.units VALUES ('unit-metro-b2', 'prop-metro-1', 'B2', '1 Bedroom', 2, 1, 1, 60, 250000, 250000, 'occupied', NULL, NULL, '2025-11-09 22:46:28.05', '2025-11-09 22:46:28.05');
INSERT INTO public.units VALUES ('unit-metro-c3', 'prop-metro-1', 'C3', 'Studio', 3, 0, 1, 35, 180000, 180000, 'vacant', NULL, NULL, '2025-11-09 22:46:28.655', '2025-11-09 22:46:28.655');


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.invoices VALUES ('inv-metro-1', 'customer-1', 'INV-METRO-001', 350000, 'NGN', 'paid', '2025-11-05 22:46:30.982', '2025-11-09 22:46:30.982', '2025-11', 'Monthly Rent', '[{"amount": 350000, "description": "Rent"}]', '2025-11-09 22:46:30.982', '2025-11-09 22:46:30.982', NULL);
INSERT INTO public.invoices VALUES ('inv-metro-2', 'customer-1', 'INV-METRO-002', 250000, 'NGN', 'pending', '2025-11-05 22:46:32.145', NULL, '2025-11', 'Monthly Rent', '[{"amount": 250000, "description": "Rent"}]', '2025-11-09 22:46:32.145', '2025-11-09 22:46:32.145', NULL);
INSERT INTO public.invoices VALUES ('770e5878-2771-46cc-90cf-aef614bf702a', 'b5936565-dac1-4be5-b992-89d88ca536cc', 'INV-1763308884298-F7A1OZ0NF', 49.99, 'USD', 'pending', '2025-11-30 16:01:24.298', NULL, 'Monthly', 'Developer Starter Plan - Monthly Subscription (Trial period invoice - Payment due at end of trial)', '[{"amount": 49.99, "quantity": 1, "unitPrice": 49.99, "description": "Developer Starter Plan - Monthly Subscription"}]', '2025-11-16 16:01:24.303', '2025-11-16 16:01:24.301', NULL);


--
-- Data for Name: leases; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.leases VALUES ('lease-metro-1', 'prop-metro-1', 'unit-metro-a1', 'user-tenant-1', 'LEASE-METRO-001', '2025-09-09 21:46:29.291', '2026-11-09 22:46:29.291', 350000, 350000, 'NGN', 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:29.291', '2025-11-09 22:46:29.291');
INSERT INTO public.leases VALUES ('lease-metro-2', 'prop-metro-1', 'unit-metro-b2', 'user-tenant-2', 'LEASE-METRO-002', '2025-10-09 21:46:30.351', '2026-11-09 22:46:30.351', 250000, 250000, 'NGN', 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-09 22:46:30.351', '2025-11-09 22:46:30.351');


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: maintenance_updates; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: mrr_snapshots; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.mrr_snapshots VALUES ('28df4ff3-ae2e-4c0e-9244-4fd4cb5e4600', 'customer-1', '2025-11-01 00:00:00', 1200, 'plan-professional-1', 'Professional', 'active', 'monthly', '2025-11-11 00:10:00.394');
INSERT INTO public.mrr_snapshots VALUES ('698577f9-4e30-4742-9ec5-59a557544f4e', 'b5936565-dac1-4be5-b992-89d88ca536cc', '2025-11-01 00:00:00', 49.99, 'cb6d91a7-c6c6-4ac1-8fc2-a04a867bafeb', 'Developer Starter', 'active', 'monthly', '2025-11-16 16:04:25.51');


--
-- Data for Name: onboarding_applications; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.payments VALUES ('payment-metro-1', 'customer-1', 'prop-metro-1', 'unit-metro-a1', 'lease-metro-1', 'user-tenant-1', 'inv-metro-1', 350000, 'NGN', 'success', 'rent', 'bank_transfer', 'manual', 'MANUAL-DEMO-1', 0, '2025-11-09 22:49:55.533', '{"note": "Seeded payment (manual)"}', '2025-11-09 22:49:55.533', '2025-11-09 22:49:55.533', NULL);
INSERT INTO public.payments VALUES ('payment-metro-2', 'customer-1', 'prop-metro-1', 'unit-metro-b2', 'lease-metro-2', 'user-tenant-2', 'inv-metro-2', 250000, 'NGN', 'pending', 'rent', 'paystack', 'paystack', 'PSK-DEMO-PENDING-1', NULL, NULL, '{"note": "Seeded payment (pending)"}', '2025-11-09 22:49:55.763', '2025-11-09 22:49:55.763', NULL);


--
-- Data for Name: property_keys; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: property_key_transactions; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: property_managers; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.property_managers VALUES ('pm-assignment-1', 'prop-metro-1', 'user-manager-1', NULL, true, '2025-11-09 22:46:26.132');


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.roles VALUES ('role-super-admin', 'Super Admin', 'Full system access with all permissions for internal admin users', '["customer_management", "customer_create", "customer_edit", "customer_delete", "customer_view", "user_management", "user_create", "user_edit", "user_delete", "user_view", "role_management", "role_create", "role_edit", "role_delete", "billing_management", "plan_management", "invoice_management", "payment_view", "analytics_view", "analytics_reports", "analytics_export", "system_health", "system_settings", "platform_settings", "system_logs", "support_tickets", "support_view", "support_respond", "support_close", "activity_logs", "audit_reports"]', true, true, '2025-11-09 22:49:55.989', '2025-11-09 22:49:55.988');
INSERT INTO public.roles VALUES ('role-property-owner', 'Property Owner', 'Full access to all features', '["property_management", "tenant_management", "financial_reports", "maintenance_management", "access_control", "user_management"]', true, true, '2025-11-09 22:49:56.873', '2025-11-09 22:49:56.872');
INSERT INTO public.roles VALUES ('role-property-manager', 'Property Manager', 'Manage assigned properties', '["property_management", "tenant_management", "maintenance_management", "access_control"]', true, true, '2025-11-09 22:49:57.428', '2025-11-09 22:49:57.426');
INSERT INTO public.roles VALUES ('role-tenant', 'Tenant', 'Tenant portal access', '["view_lease", "submit_maintenance", "make_payments"]', true, true, '2025-11-09 22:49:58.102', '2025-11-09 22:49:58.101');
INSERT INTO public.roles VALUES ('role-admin', 'Admin', 'Internal admin with broad platform access', '["customer_management", "customer_create", "customer_edit", "customer_delete", "customer_view", "user_management", "user_create", "user_edit", "user_delete", "user_view", "role_management", "role_create", "role_edit", "role_delete", "billing_management", "plan_management", "invoice_management", "payment_view", "analytics_view", "analytics_reports", "analytics_export", "system_health", "platform_settings", "support_tickets", "support_view", "support_respond", "support_close", "activity_logs", "audit_reports"]', true, true, '2025-11-09 22:49:58.654', '2025-11-09 22:49:58.652');
INSERT INTO public.roles VALUES ('role-billing', 'Billing', 'Finance team with billing and plan management access', '["billing_management", "plan_management", "invoice_management", "payment_view", "customer_view", "analytics_view"]', true, true, '2025-11-09 22:49:59.216', '2025-11-09 22:49:59.215');
INSERT INTO public.roles VALUES ('role-support', 'Support', 'Support staff for handling support tickets and customer view', '["support_tickets", "support_view", "support_respond", "support_close", "customer_view"]', true, true, '2025-11-09 22:49:59.773', '2025-11-09 22:49:59.772');
INSERT INTO public.roles VALUES ('role-analyst', 'Analyst', 'Read-only analytics and reporting', '["analytics_view", "analytics_reports", "analytics_export", "customer_view"]', true, true, '2025-11-09 22:50:00.339', '2025-11-09 22:50:00.337');


--
-- Data for Name: subscription_events; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--

INSERT INTO public.system_settings VALUES ('setting-site-name', 'site_name', '"Contrezz"', 'system', 'Platform name', '2025-11-09 22:50:00.898', '2025-11-09 22:50:00.896');
INSERT INTO public.system_settings VALUES ('setting-maintenance-mode', 'maintenance_mode', 'false', 'system', 'Enable/disable maintenance mode', '2025-11-09 22:50:01.873', '2025-11-09 22:50:01.872');
INSERT INTO public.system_settings VALUES ('setting-default-currency', 'default_currency', '"USD"', 'system', 'Default platform currency', '2025-11-09 22:50:02.428', '2025-11-09 22:50:02.427');
INSERT INTO public.system_settings VALUES ('setting-favicon-1763141937879', 'platform_favicon_url', '"https://contrezz-uploads.nyc3.digitaloceanspaces.com/favicons/platform-favicon-1763141937681.png"', 'branding', 'Platform favicon URL', '2025-11-14 17:38:57.879', '2025-11-14 17:38:57.879');
INSERT INTO public.system_settings VALUES ('setting-logo-1763143511857', 'platform_logo_url', '"https://contrezz-uploads.nyc3.digitaloceanspaces.com/logos/platform-logo-1763143511823.svg"', 'branding', 'Platform logo URL', '2025-11-14 18:05:11.857', '2025-11-14 18:05:11.857');


--
-- Data for Name: trial_notifications; Type: TABLE DATA; Schema: public; Owner: contrezz_user
--



--
-- PostgreSQL database dump complete
--
