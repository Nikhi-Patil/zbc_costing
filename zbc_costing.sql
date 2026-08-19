-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 19, 2026 at 08:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `zbc_costing`
--

-- --------------------------------------------------------

--
-- Table structure for table `bop_monthly_report`
--

CREATE TABLE `bop_monthly_report` (
  `id` int(11) NOT NULL,
  `bop_id` int(11) NOT NULL,
  `part_no` varchar(50) DEFAULT NULL,
  `fg_code` varchar(50) DEFAULT NULL,
  `bop_part_name` varchar(100) DEFAULT NULL,
  `bop_part_no` varchar(50) DEFAULT NULL,
  `bop_erp_code` varchar(50) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `financial_year` varchar(9) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `qty` decimal(12,2) DEFAULT 0.00,
  `rate` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compound_monthly_report`
--

CREATE TABLE `compound_monthly_report` (
  `id` int(11) NOT NULL,
  `compound_id` int(11) NOT NULL,
  `compound_code` varchar(50) NOT NULL,
  `polymer_name` varchar(100) NOT NULL,
  `im_code` varchar(50) DEFAULT NULL,
  `unit_id` int(11) NOT NULL,
  `financial_year` varchar(9) NOT NULL,
  `month` tinyint(2) NOT NULL,
  `qty` decimal(12,2) DEFAULT 0.00,
  `rate` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `molding_bop_table`
--

CREATE TABLE `molding_bop_table` (
  `id` int(11) NOT NULL,
  `molding_id` int(11) NOT NULL,
  `bop_part_no` varchar(50) DEFAULT NULL,
  `bop_part_name` varchar(100) DEFAULT NULL,
  `commodity` varchar(100) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `bop_assembly_qty` decimal(12,2) DEFAULT NULL,
  `bop_fg_code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `bop_month` varchar(20) DEFAULT NULL,
  `bop_rate` decimal(12,2) DEFAULT NULL,
  `bop_cost` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `molding_table`
--

CREATE TABLE `molding_table` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(30) NOT NULL,
  `status` enum('DRAFT','FINAL') NOT NULL DEFAULT 'DRAFT',
  `financial_year` varchar(20) NOT NULL,
  `month` varchar(20) NOT NULL,
  `effective_date` date NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `production_unit` varchar(100) NOT NULL,
  `billing_unit` varchar(100) NOT NULL,
  `sub_department` varchar(100) NOT NULL,
  `sub_category` varchar(100) NOT NULL,
  `part_no` varchar(50) NOT NULL,
  `part_name` varchar(100) NOT NULL,
  `fg_code` varchar(50) NOT NULL,
  `im_code` varchar(50) DEFAULT NULL,
  `gross_weight` decimal(12,3) DEFAULT NULL,
  `net_weight` decimal(12,3) DEFAULT NULL,
  `loading_per` decimal(10,2) DEFAULT NULL,
  `has_bop` varchar(10) NOT NULL,
  `polymer_name` varchar(100) DEFAULT NULL,
  `compound_code` varchar(100) DEFAULT NULL,
  `rm_im_code` varchar(50) DEFAULT NULL,
  `comp_month` varchar(20) DEFAULT NULL,
  `compound_rate` decimal(12,2) DEFAULT NULL,
  `total_rm_cost` decimal(12,2) DEFAULT NULL,
  `process_type` varchar(100) DEFAULT NULL,
  `machine_tonnage` varchar(50) DEFAULT NULL,
  `shift_rate` decimal(12,2) DEFAULT NULL,
  `total_cavity` int(11) DEFAULT NULL,
  `running_cavity` int(11) DEFAULT NULL,
  `cycle_time` decimal(12,2) DEFAULT NULL,
  `shift_time_efficiency` decimal(10,2) DEFAULT NULL,
  `efficiency` decimal(12,2) DEFAULT NULL,
  `total_shots` decimal(12,2) DEFAULT NULL,
  `total_production_per_shift` decimal(12,2) DEFAULT NULL,
  `platten_size` varchar(100) DEFAULT NULL,
  `tool_size` varchar(100) DEFAULT NULL,
  `process_cost_a` decimal(12,2) DEFAULT NULL,
  `post_curing` decimal(12,2) DEFAULT NULL,
  `finishing` decimal(12,2) DEFAULT NULL,
  `inspection` decimal(12,2) DEFAULT NULL,
  `assembly_qty` decimal(12,2) DEFAULT NULL,
  `assembly_per_cost` decimal(12,2) DEFAULT NULL,
  `total_assembly_cost` decimal(12,2) DEFAULT NULL,
  `process_cost_b` decimal(12,2) DEFAULT NULL,
  `conversion_cost` decimal(12,2) DEFAULT NULL,
  `part_cost` decimal(10,2) NOT NULL,
  `sell_cost` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `icc_on_rm` decimal(10,2) DEFAULT NULL,
  `rej_on_subtotal` decimal(10,2) DEFAULT NULL,
  `oh_on_subtotal` decimal(10,2) DEFAULT NULL,
  `profit_on_subtotal` decimal(10,2) DEFAULT NULL,
  `packaging_on_subtotal` decimal(10,2) DEFAULT NULL,
  `transport_on_subtotal` decimal(10,2) DEFAULT NULL,
  `total_bop_cost` decimal(12,2) DEFAULT NULL,
  `final_rm_cost` decimal(12,2) DEFAULT NULL,
  `icc_on_rm_cost` decimal(12,2) DEFAULT NULL,
  `rej_on_subtotal_cost` decimal(12,2) DEFAULT NULL,
  `oh_on_subtotal_cost` decimal(12,2) DEFAULT NULL,
  `profit_on_subtotal_cost` decimal(12,2) DEFAULT NULL,
  `packaging_on_subtotal_cost` decimal(12,2) DEFAULT NULL,
  `transport_on_subtotal_cost` decimal(12,2) DEFAULT NULL,
  `customer_sales_cost` decimal(12,2) DEFAULT NULL,
  `sales_profit_loss` decimal(12,2) DEFAULT NULL,
  `buying_cost` decimal(12,2) DEFAULT NULL,
  `buying_profit_loss` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bop_monthly_report`
--
ALTER TABLE `bop_monthly_report`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bop_supplier_year_month` (`bop_id`,`supplier_id`,`financial_year`,`month`),
  ADD UNIQUE KEY `uq_bop_supplier_fy_month` (`bop_id`,`supplier_id`,`financial_year`,`month`);

--
-- Indexes for table `compound_monthly_report`
--
ALTER TABLE `compound_monthly_report`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_compound_unit_year_month` (`compound_id`,`unit_id`,`financial_year`,`month`),
  ADD KEY `idx_compound_code` (`compound_code`),
  ADD KEY `idx_year_month` (`financial_year`,`month`);

--
-- Indexes for table `molding_bop_table`
--
ALTER TABLE `molding_bop_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_molding_bop` (`molding_id`);

--
-- Indexes for table `molding_table`
--
ALTER TABLE `molding_table`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bop_monthly_report`
--
ALTER TABLE `bop_monthly_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `compound_monthly_report`
--
ALTER TABLE `compound_monthly_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `molding_bop_table`
--
ALTER TABLE `molding_bop_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `molding_table`
--
ALTER TABLE `molding_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `molding_bop_table`
--
ALTER TABLE `molding_bop_table`
  ADD CONSTRAINT `fk_molding_bop` FOREIGN KEY (`molding_id`) REFERENCES `molding_table` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
