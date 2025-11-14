ALTER TABLE ONLY public.product_variants
ADD CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY (id);
ALTER TABLE ONLY public.taxes
ADD CONSTRAINT "PK_6c58c9cbb420c4f65e3f5eb8162" PRIMARY KEY (id);
ALTER TABLE ONLY public.migrations
ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);
ALTER TABLE ONLY public.users
ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);
ALTER TABLE ONLY public.beta_keys
ADD CONSTRAINT "PK_beta_keys" PRIMARY KEY (id);
ALTER TABLE ONLY public.categories
ADD CONSTRAINT "PK_c4e4bc56c5a700e345b5fc428d4" PRIMARY KEY (id);
ALTER TABLE ONLY public.cash_registers
ADD CONSTRAINT "PK_cash_registers" PRIMARY KEY (id);
ALTER TABLE ONLY public.customer_credits
ADD CONSTRAINT "PK_customer_credits" PRIMARY KEY (id);
ALTER TABLE ONLY public.customers
ADD CONSTRAINT "PK_customers" PRIMARY KEY (id);
ALTER TABLE ONLY public.dian_resolutions
ADD CONSTRAINT "PK_dian_resolutions" PRIMARY KEY (id);
ALTER TABLE ONLY public.expenses
ADD CONSTRAINT "PK_expenses" PRIMARY KEY (id);
ALTER TABLE ONLY public.fiscal_configs
ADD CONSTRAINT "PK_fiscal_configs" PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_movements
ADD CONSTRAINT "PK_inventory_movements" PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_stock
ADD CONSTRAINT "PK_inventory_stock" PRIMARY KEY (id);
ALTER TABLE ONLY public.otp_codes
ADD CONSTRAINT "PK_otp_codes" PRIMARY KEY (id);
ALTER TABLE ONLY public.payments
ADD CONSTRAINT "PK_payments" PRIMARY KEY (id);
ALTER TABLE ONLY public.products
ADD CONSTRAINT "PK_products" PRIMARY KEY (id);
ALTER TABLE ONLY public.sale_items
ADD CONSTRAINT "PK_sale_items" PRIMARY KEY (id);
ALTER TABLE ONLY public.sales
ADD CONSTRAINT "PK_sales" PRIMARY KEY (id);
ALTER TABLE ONLY public.tenants
ADD CONSTRAINT "PK_tenants" PRIMARY KEY (id);
ALTER TABLE ONLY public.cash_movements
ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chart_of_accounts
ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.journal_entries
ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.journal_entry_lines
ADD CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tax_withholdings
ADD CONSTRAINT tax_withholdings_pkey PRIMARY KEY (id);