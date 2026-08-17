-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 17, 2026 at 02:21 PM
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
-- Table structure for table `compound_monthly_report`
--

CREATE TABLE `compound_monthly_report` (
  `id` int(11) NOT NULL,
  `compound_id` int(11) NOT NULL,
  `compound_code` varchar(50) NOT NULL,
  `polymer_name` varchar(100) NOT NULL,
  `im_code` varchar(50) DEFAULT NULL,
  `year` year(4) NOT NULL,
  `month` tinyint(2) NOT NULL,
  `qty` decimal(12,2) DEFAULT 0.00,
  `rate` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `compound_monthly_report`
--

INSERT INTO `compound_monthly_report` (`id`, `compound_id`, `compound_code`, `polymer_name`, `im_code`, `year`, `month`, `qty`, `rate`, `created_at`, `updated_at`) VALUES
(1, 93, 'JAE/6001 (FB)', 'EPDM', 'IM10020630', '2026', 8, 78.00, 132.00, '2026-08-17 12:07:50', '2026-08-17 12:07:50'),
(2, 93, 'JAE/6001 (FB)', 'EPDM', 'IM10020630', '2026', 1, 7854.00, 98.00, '2026-08-17 12:08:15', '2026-08-17 12:08:15'),
(3, 92, 'VITON/7/EX/372 (FB)', 'VITON', 'IM10020519', '2026', 1, 785.00, 9551.00, '2026-08-17 12:08:35', '2026-08-17 12:08:35'),
(4, 91, 'EP/60/VGT/8 (FB)', 'EPDM', 'IM10021062', '2026', 9, 45.00, 20.00, '2026-08-17 12:20:28', '2026-08-17 12:20:28');

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

--
-- Dumping data for table `molding_bop_table`
--

INSERT INTO `molding_bop_table` (`id`, `molding_id`, `bop_part_no`, `bop_part_name`, `commodity`, `supplier_id`, `bop_assembly_qty`, `bop_fg_code`, `created_at`, `bop_month`, `bop_rate`, `bop_cost`) VALUES
(337, 4, '4152', 'ring', 'asd', 2, 5.00, '1', '2026-08-14 11:56:27', 'September', 45.00, 225.00),
(338, 4, '4152', 'ring', 'awwe', 1, 10.00, '1', '2026-08-14 11:56:27', 'June', 42.00, 420.00),
(437, 9, '4152', 'ring', 'ASD', 1, 1.00, '1', '2026-08-17 09:07:10', 'August', 4.64, 4.64),
(438, 9, '4152', 'ring', 'SDF', 2, 1.00, '1', '2026-08-17 09:07:10', 'October', 49.02, 49.02);

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
  `rm_loading_weight` decimal(12,3) DEFAULT NULL,
  `rm_net_weight` decimal(12,3) DEFAULT NULL,
  `rm_loading_per` decimal(10,2) DEFAULT NULL,
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
  `part_cost` int(11) NOT NULL,
  `sell_cost` int(11) NOT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `icc_on_rm` decimal(10,2) DEFAULT 1.00,
  `rej_on_subtotal` decimal(10,2) DEFAULT 3.00,
  `oh_on_subtotal` decimal(10,2) DEFAULT 10.00,
  `profit_on_subtotal` decimal(10,2) DEFAULT 10.00,
  `packaging_on_subtotal` decimal(10,2) DEFAULT 2.00,
  `transport_on_subtotal` decimal(10,2) DEFAULT 2.00,
  `total_bop_cost` decimal(12,2) DEFAULT NULL,
  `final_rm_cost` decimal(12,2) DEFAULT NULL,
  `icc_on_rm_cost` decimal(12,2) DEFAULT 0.00,
  `rej_on_subtotal_cost` decimal(12,2) DEFAULT 0.00,
  `oh_on_subtotal_cost` decimal(12,2) DEFAULT 0.00,
  `profit_on_subtotal_cost` decimal(12,2) DEFAULT 0.00,
  `packaging_on_subtotal_cost` decimal(12,2) DEFAULT 0.00,
  `transport_on_subtotal_cost` decimal(12,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `molding_table`
--

INSERT INTO `molding_table` (`id`, `transaction_id`, `status`, `financial_year`, `month`, `effective_date`, `customer_name`, `production_unit`, `billing_unit`, `sub_department`, `sub_category`, `part_no`, `part_name`, `fg_code`, `im_code`, `gross_weight`, `net_weight`, `loading_per`, `has_bop`, `polymer_name`, `compound_code`, `rm_im_code`, `comp_month`, `compound_rate`, `rm_loading_weight`, `rm_net_weight`, `rm_loading_per`, `total_rm_cost`, `process_type`, `machine_tonnage`, `shift_rate`, `total_cavity`, `running_cavity`, `cycle_time`, `shift_time_efficiency`, `efficiency`, `total_shots`, `total_production_per_shift`, `platten_size`, `tool_size`, `process_cost_a`, `post_curing`, `finishing`, `inspection`, `assembly_qty`, `assembly_per_cost`, `total_assembly_cost`, `process_cost_b`, `conversion_cost`, `part_cost`, `sell_cost`, `created_by`, `created_at`, `updated_by`, `updated_at`, `icc_on_rm`, `rej_on_subtotal`, `oh_on_subtotal`, `profit_on_subtotal`, `packaging_on_subtotal`, `transport_on_subtotal`, `total_bop_cost`, `final_rm_cost`, `icc_on_rm_cost`, `rej_on_subtotal_cost`, `oh_on_subtotal_cost`, `profit_on_subtotal_cost`, `packaging_on_subtotal_cost`, `transport_on_subtotal_cost`) VALUES
(1, 'ML000001', 'DRAFT', '2026-27', '08', '2026-08-08', '1', '4', 'UNIT-03', '3', '5', '84B525890-P5', 'Gasket', 'FGG0020125', 'IM0001', 545.000, 255.000, 113.73, 'No', 'NBR', 'NBR/70/IRH (FB)', 'IM0001', '', 0.00, 0.000, 0.000, 0.00, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-12 11:04:40', NULL, '2026-08-14 09:52:03', 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(3, 'ML000002', 'DRAFT', '', '', '0000-00-00', '', '', '', '', '', '', '', '', '', 0.000, 0.000, 0.00, '', '', '', '', '', 0.00, 0.000, 0.000, 0.00, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-12 11:14:14', NULL, NULL, 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(4, 'ML000003', 'DRAFT', '2026-27', '02', '2026-05-28', '1', '2', 'UNIT-06', '2', '4', '84B525890-P5', 'Gasket', 'FGG0020125', 'IM0002', 65.000, 21.000, 209.52, 'Yes', 'NR', 'NR/60/TENNECO (FB)', 'IM0002', '', 410.00, NULL, NULL, NULL, 26.65, 'Compression', '100T', 1250.00, 46, 46, 12.00, 85.00, 408.00, 34.00, 1564.00, '', '', 0.80, 0.50, 0.50, 0.50, 0.00, 3.00, 45.00, 46.50, 47.30, 0, 0, NULL, '2026-08-12 11:19:21', NULL, '2026-08-14 11:46:53', 0.00, 3.00, 10.00, 10.00, 2.00, 2.00, 645.00, 671.65, 0.00, 21.57, 71.89, 71.89, 14.38, 14.38),
(5, 'ML000004', 'DRAFT', '', '', '0000-00-00', '', '', '', '', '', '', '', '', '', 0.000, 0.000, 0.00, '', '', '', '', '', 0.00, 0.000, 0.000, 0.00, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-12 11:21:17', NULL, '2026-08-14 09:52:51', 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(6, 'ML000005', 'DRAFT', '', '', '0000-00-00', '', '', '', '', '', '', '', '', '', 0.000, 0.000, 0.00, '', '', '', '', '', 0.00, 0.000, 0.000, 0.00, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-12 11:25:43', NULL, '2026-08-14 09:52:44', 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(7, 'ML000006', 'DRAFT', '', '', '0000-00-00', '', '', '', '', '', '', '', '', '', 0.000, 0.000, 0.00, 'No', '', '', '', '', 0.00, NULL, NULL, NULL, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-13 11:50:59', NULL, '2026-08-14 09:52:42', 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(8, 'ML000007', 'DRAFT', '', '', '0000-00-00', '', '', '', '', '', '', '', '', '', 0.000, 0.000, 0.00, '', '', '', '', '', 0.00, NULL, NULL, NULL, 0.00, '', '', 0.00, 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, 0, NULL, '2026-08-13 11:58:49', NULL, '2026-08-14 09:52:40', 1.00, 3.00, 10.00, 10.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00),
(9, 'ML000008', 'DRAFT', '2026-27', '08', '2026-08-14', '1', '2', '4', '2', '5', '84B525890-P5', 'Gasket', 'FGG0020125', 'IM0002', 4.500, 3.000, 50.00, 'Yes', 'EPDM', 'JAE/6001 (FB)', 'IM0002', '', 350.00, NULL, NULL, NULL, 1.57, 'Compression', '150T', 1500.00, 16, 16, 12.00, 85.00, 408.00, 34.00, 544.00, '', '300x300x100', 2.76, 0.00, 0.75, 0.75, 0.00, 0.50, 1.00, 2.50, 5.26, 82, 0, NULL, '2026-08-14 12:21:09', NULL, '2026-08-17 06:37:10', 2.00, 5.00, 10.00, 10.00, 4.00, 4.00, 53.66, 55.23, 1.10, 3.02, 6.05, 6.05, 2.42, 2.42);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `compound_monthly_report`
--
ALTER TABLE `compound_monthly_report`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_compound_year_month` (`compound_id`,`year`,`month`),
  ADD KEY `idx_compound_code` (`compound_code`),
  ADD KEY `idx_year_month` (`year`,`month`);

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
-- AUTO_INCREMENT for table `compound_monthly_report`
--
ALTER TABLE `compound_monthly_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `molding_bop_table`
--
ALTER TABLE `molding_bop_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=439;

--
-- AUTO_INCREMENT for table `molding_table`
--
ALTER TABLE `molding_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
