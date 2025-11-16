--
-- Name: subscription_events subscription_events_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.subscription_events
    ADD CONSTRAINT subscription_events_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: trial_notifications trial_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.trial_notifications
    ADD CONSTRAINT trial_notifications_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: contrezz_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admins_email_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);


--
-- Name: customer_users_customerId_userId_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "customer_users_customerId_userId_key" ON public.customer_users USING btree ("customerId", "userId");


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: customers_gracePeriodEndsAt_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "customers_gracePeriodEndsAt_idx" ON public.customers USING btree ("gracePeriodEndsAt");


--
-- Name: customers_status_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX customers_status_idx ON public.customers USING btree (status);


--
-- Name: customers_trialEndsAt_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "customers_trialEndsAt_idx" ON public.customers USING btree ("trialEndsAt");


--
-- Name: expenses_category_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX expenses_category_idx ON public.expenses USING btree (category);


--
-- Name: expenses_date_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX expenses_date_idx ON public.expenses USING btree (date);


--
-- Name: expenses_propertyId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "expenses_propertyId_idx" ON public.expenses USING btree ("propertyId");


--
-- Name: expenses_status_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX expenses_status_idx ON public.expenses USING btree (status);


--
-- Name: expenses_visibleToManager_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "expenses_visibleToManager_idx" ON public.expenses USING btree ("visibleToManager");


--
-- Name: invoices_invoiceNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON public.invoices USING btree ("invoiceNumber");


--
-- Name: leases_leaseNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "leases_leaseNumber_key" ON public.leases USING btree ("leaseNumber");


--
-- Name: maintenance_requests_ticketNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "maintenance_requests_ticketNumber_key" ON public.maintenance_requests USING btree ("ticketNumber");


--
-- Name: mrr_snapshots_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "mrr_snapshots_customerId_idx" ON public.mrr_snapshots USING btree ("customerId");


--
-- Name: mrr_snapshots_customerId_month_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "mrr_snapshots_customerId_month_key" ON public.mrr_snapshots USING btree ("customerId", month);


--
-- Name: mrr_snapshots_month_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX mrr_snapshots_month_idx ON public.mrr_snapshots USING btree (month);


--
-- Name: onboarding_applications_applicationType_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "onboarding_applications_applicationType_idx" ON public.onboarding_applications USING btree ("applicationType");


--
-- Name: onboarding_applications_createdAt_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "onboarding_applications_createdAt_idx" ON public.onboarding_applications USING btree ("createdAt");


--
-- Name: onboarding_applications_customerId_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "onboarding_applications_customerId_key" ON public.onboarding_applications USING btree ("customerId");


--
-- Name: onboarding_applications_email_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX onboarding_applications_email_idx ON public.onboarding_applications USING btree (email);


--
-- Name: onboarding_applications_email_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX onboarding_applications_email_key ON public.onboarding_applications USING btree (email);


--
-- Name: onboarding_applications_reviewStatus_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "onboarding_applications_reviewStatus_idx" ON public.onboarding_applications USING btree ("reviewStatus");


--
-- Name: onboarding_applications_status_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX onboarding_applications_status_idx ON public.onboarding_applications USING btree (status);


--
-- Name: onboarding_applications_userId_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "onboarding_applications_userId_key" ON public.onboarding_applications USING btree ("userId");


--
-- Name: payment_methods_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payment_methods_customerId_idx" ON public.payment_methods USING btree ("customerId");


--
-- Name: payment_methods_isActive_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payment_methods_isActive_idx" ON public.payment_methods USING btree ("isActive");


--
-- Name: payment_methods_isDefault_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payment_methods_isDefault_idx" ON public.payment_methods USING btree ("isDefault");


--
-- Name: payment_methods_tenantId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payment_methods_tenantId_idx" ON public.payment_methods USING btree ("tenantId");


--
-- Name: payment_settings_customerId_provider_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "payment_settings_customerId_provider_key" ON public.payment_settings USING btree ("customerId", provider);


--
-- Name: payments_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payments_customerId_idx" ON public.payments USING btree ("customerId");


--
-- Name: payments_leaseId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payments_leaseId_idx" ON public.payments USING btree ("leaseId");


--
-- Name: payments_paymentMethodId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payments_paymentMethodId_idx" ON public.payments USING btree ("paymentMethodId");


--
-- Name: payments_propertyId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "payments_propertyId_idx" ON public.payments USING btree ("propertyId");


--
-- Name: payments_provider_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX payments_provider_idx ON public.payments USING btree (provider);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: plans_name_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX plans_name_key ON public.plans USING btree (name);


--
-- Name: property_key_transactions_action_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX property_key_transactions_action_idx ON public.property_key_transactions USING btree (action);


--
-- Name: property_key_transactions_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "property_key_transactions_customerId_idx" ON public.property_key_transactions USING btree ("customerId");


--
-- Name: property_key_transactions_keyId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "property_key_transactions_keyId_idx" ON public.property_key_transactions USING btree ("keyId");


--
-- Name: property_keys_customerId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "property_keys_customerId_idx" ON public.property_keys USING btree ("customerId");


--
-- Name: property_keys_keyNumber_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "property_keys_keyNumber_key" ON public.property_keys USING btree ("keyNumber");


--
-- Name: property_keys_keyType_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "property_keys_keyType_idx" ON public.property_keys USING btree ("keyType");


--
-- Name: property_keys_propertyId_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX "property_keys_propertyId_idx" ON public.property_keys USING btree ("propertyId");


--
-- Name: property_keys_status_idx; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE INDEX property_keys_status_idx ON public.property_keys USING btree (status);


--
-- Name: property_managers_propertyId_managerId_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX "property_managers_propertyId_managerId_key" ON public.property_managers USING btree ("propertyId", "managerId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: contrezz_user
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: subscription_events_createdAt_idx; Type: INDEX; Schema: public; Owner: contrezz_user
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