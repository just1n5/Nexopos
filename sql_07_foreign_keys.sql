ALTER TABLE ONLY public.customers
ADD CONSTRAINT "FK_37c1a605468d156e6a8f78f1dc5" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sales
ADD CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.taxes
ADD CONSTRAINT "FK_3b850d0c8c3b744f80f3959a2fe" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.categories
ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products
ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.categories
ADD CONSTRAINT "FK_b3ba4108a54b7ab5c342d754d1f" FOREIGN KEY (parent_id) REFERENCES public.categories(id);
ALTER TABLE ONLY public.beta_keys
ADD CONSTRAINT "FK_beta_keys_tenant" FOREIGN KEY ("usedByTenantId") REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT "FK_cash_movements_approvedBy" FOREIGN KEY ("approvedBy") REFERENCES public.users(id);
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT "FK_cash_movements_payment" FOREIGN KEY ("paymentId") REFERENCES public.payments(id);
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT "FK_cash_movements_refund" FOREIGN KEY ("refundId") REFERENCES public.sales(id);
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT "FK_cash_movements_sale" FOREIGN KEY ("saleId") REFERENCES public.sales(id);
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT "FK_cash_movements_user" FOREIGN KEY ("userId") REFERENCES public.users(id);
ALTER TABLE ONLY public.customer_credits
ADD CONSTRAINT "FK_customer_credits_customerId" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.dian_resolutions
ADD CONSTRAINT "FK_dian_resolutions_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.expenses
ADD CONSTRAINT "FK_expenses_processedBy" FOREIGN KEY ("processedById") REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.expenses
ADD CONSTRAINT "FK_expenses_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_variants
ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.fiscal_configs
ADD CONSTRAINT "FK_fiscal_configs_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventory_movements
ADD CONSTRAINT "FK_inventory_movements_processedBy" FOREIGN KEY ("processedById") REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.inventory_movements
ADD CONSTRAINT "FK_inventory_movements_product" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventory_movements
ADD CONSTRAINT "FK_inventory_movements_productVariant" FOREIGN KEY ("productVariantId") REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.inventory_movements
ADD CONSTRAINT "FK_inventory_movements_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventory_stock
ADD CONSTRAINT "FK_inventory_stock_product" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.inventory_stock
ADD CONSTRAINT "FK_inventory_stock_productVariant" FOREIGN KEY ("productVariantId") REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.inventory_stock
ADD CONSTRAINT "FK_inventory_stock_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments
ADD CONSTRAINT "FK_payments_processedBy" FOREIGN KEY ("processedById") REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments
ADD CONSTRAINT "FK_payments_sale" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sale_items
ADD CONSTRAINT "FK_sale_items_sale" FOREIGN KEY ("saleId") REFERENCES public.sales(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.users
ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.journal_entry_lines
ADD CONSTRAINT fk_account FOREIGN KEY ("accountId") REFERENCES public.chart_of_accounts(id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT fk_cancelled_by FOREIGN KEY ("cancelledBy") REFERENCES public.users(id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT fk_confirmed_by FOREIGN KEY ("confirmedBy") REFERENCES public.users(id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT fk_created_by FOREIGN KEY ("createdBy") REFERENCES public.users(id);
ALTER TABLE ONLY public.tax_withholdings
ADD CONSTRAINT fk_created_by FOREIGN KEY ("createdBy") REFERENCES public.users(id);
ALTER TABLE ONLY public.tax_withholdings
ADD CONSTRAINT fk_expense FOREIGN KEY ("expenseId") REFERENCES public.expenses(id);
ALTER TABLE ONLY public.journal_entry_lines
ADD CONSTRAINT fk_journal_entry FOREIGN KEY ("journalEntryId") REFERENCES public.journal_entries(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chart_of_accounts
ADD CONSTRAINT fk_parent_account FOREIGN KEY ("parentAccountId") REFERENCES public.chart_of_accounts(id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT fk_reversal_entry FOREIGN KEY ("reversalEntryId") REFERENCES public.journal_entries(id);
ALTER TABLE ONLY public.tax_withholdings
ADD CONSTRAINT fk_sale FOREIGN KEY ("saleId") REFERENCES public.sales(id);
ALTER TABLE ONLY public.chart_of_accounts
ADD CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES public.tenants(id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES public.tenants(id);
ALTER TABLE ONLY public.tax_withholdings
ADD CONSTRAINT fk_tenant FOREIGN KEY ("tenantId") REFERENCES public.tenants(id);