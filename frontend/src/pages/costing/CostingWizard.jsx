import { useEffect, useState } from "react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import { useParams, useNavigate } from "react-router-dom";

import Stepper from "../../components/costing/Stepper";
import WizardButtons from "../../components/costing/WizardButtons";
import PartDetailsForm from "../../components/costing/PartDetailsForm";
import RMDetailsForm from "../../components/costing/RMDetailsForm";
import ProcessDetailsForm from "../../components/costing/ProcessDetailsForm";
import BottomLineForm from "../../components/costing/BottomLineForm";
import API_BASE_URL from "../../config/api";
import { getUser } from "../../auth/auth";

const getOptionalProcessAnswer = (value) => {
  if (value === "" || value === null || value === undefined) return "No";

  const amount = Number(value);
  return Number.isFinite(amount) && amount !== 0 ? "Yes" : "No";
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function CostingWizard() {
  const { transactionId: urlTransactionId } = useParams();
  const financialYears = generateFinancialYears();
  const defaultFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  const currentMonth =
    months.find((month) => month.value === new Date().getMonth() + 1)?.value ||
    "";

  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const [currentStep, setCurrentStep] = useState(1);
  const [bops, setBops] = useState([]);
  const [transactionId, setTransactionId] = useState(urlTransactionId || "");
  const [transactionStatus, setTransactionStatus] = useState("");
  const totalSteps = 4;
  const navigate = useNavigate();

  const isViewMode = Boolean(urlTransactionId) && transactionStatus === "FINAL";
  // FORM DATA
  const [formData, setFormData] = useState({
    financialYear: defaultFinancialYear,
    month: currentMonth,
    effectiveDate: getTodayDate(),
    customerName: "",
    productionUnit: "",
    billingUnit: "",
    subDepartment: "",
    subCategory: "",
    subCategoryName: "",
    partNo: "",
    partName: "",
    fgcode: "",
    imcode: "",
    grossWeight: "",
    netWeight: "",
    loadingper: "",
    hasBop: "",
    polymerName: "",
    compoundCode: "",
    imCode: "",
    compMonth: previousMonth,
    compoundRate: "",
    totalRmCost: "",
    processType: "",
    machineTonnage: "",
    shiftRate: "",
    totalCavity: "",
    runningCavity: "",
    cycleTime: "",
    shiftTimeEfficiency: "",
    efficiency: "",
    totalShots: "",
    totalProductionPerShift: "",
    PlattenSize: "",
    toolSize: "",
    processCostA: "",
    postCuring: "",
    finishing: "",
    inspection: "",
    shotBlasting: "",
    vapourDegreasing: "",
    chromating: "",
    phospating: "",
    adhesive: "",
    painting: "",
    cylindricalGrinding: "",
    plating: "",
    // Required selections used by ProcessDetailsForm.
    postCuringRequired: "No",
    finishingRequired: "No",
    inspectionRequired: "No",
    shotBlastingRequired: "No",
    vapourDegreasingRequired: "No",
    chromatingRequired: "No",
    phospatingRequired: "No",
    adhesiveRequired: "No",
    paintingRequired: "No",
    platingRequired: "No",
    cylindricalGrindingRequired: "No",
    // Inputs used by margin-master-based process calculations
    bopWeight: "",
    bopArea: "",
    paintArea: "",
    paintPerLit: "",
    finishedPartWeight: "",
    metalPartArea: "",
    // Rates fetched from Margin Master (not user-editable)
    postCuringRate: 0,
    shotBlastingRate: 0,
    vapourDegreasingRate: 0,
    chromatingRate: 0,
    phospatingRate: 0,
    adhesiveRate: 0,
    paintingRate: 0,
    platingRate: 0,
    cylindricalGrindingRate: 0,
    assemblyQty: "",
    assemblyPerCost: "",
    totalAssemblyCost: "",
    processCostB: "",
    conversionCost: "",
    partCost: "",
    iccOnRm: "1",
    rejOnSubtotal: "3",
    ohOnSubtotal: "10",
    profitOnSubtotal: "10",
    packagingOnSubtotal: "2",
    transportOnSubtotal: "2",
    iccOnRmCost: "",
    rejOnSubtotalCost: "",
    ohOnSubtotalCost: "",
    profitOnSubtotalCost: "",
    packagingOnSubtotalCost: "",
    transportOnSubtotalCost: "",
    totalBopCost: "",
    finalRmCost: "",
    customerSalesCost: "",
    salesProfitLoss: "",
    buyingType: "INHOUSE",
    vendorName: "",
    buyingCost: "",
    buyingProfitLoss: "",
    monthlyQuantity: "",
    monthlyProfitLoss: "",
    subtotalA: "",
    subtotalB: "",
  });

  // AUTO-FILL LOGIN SESSION VALUES FOR NEW COSTING
  useEffect(() => {
    if (urlTransactionId) {
      return;
    }
    const user = getUser();
    if (!user) {
      console.warn("No logged-in user found in session");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      productionUnit: user.unit ?? prev.productionUnit,
      billingUnit: user.unit ?? prev.billingUnit,
      subDepartment: user.sub_department ?? prev.subDepartment,
      effectiveDate: prev.effectiveDate || getTodayDate(),
    }));
  }, [urlTransactionId]);

  useEffect(() => {
    if (!urlTransactionId) {
      return;
    }
    setTransactionId(urlTransactionId);
    fetchTransaction(urlTransactionId);
  }, [urlTransactionId]);

  // LOAD MARGIN MASTER DEFAULTS
  useEffect(() => {
    const fetchMargins = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/margins`);

        if (!response.ok) {
          throw new Error("Failed to fetch margin defaults");
        }

        const margins = await response.json();

        const marginMap = {};

        margins.forEach((margin) => {
          marginMap[String(margin.margin_type).trim().toLowerCase()] =
            Number(margin.percentage) || 0;
        });

        setFormData((prev) => ({
          ...prev,

          // Process rates are always loaded from Margin Master, including when
          // reopening a saved transaction.
          postCuringRate:
            marginMap["post curing charges"] ?? prev.postCuringRate,
          shotBlastingRate: marginMap["shot blasting"] ?? prev.shotBlastingRate,
          vapourDegreasingRate:
            marginMap["vapour degreasing"] ?? prev.vapourDegreasingRate,
          chromatingRate: marginMap["chromating"] ?? prev.chromatingRate,
          phospatingRate: marginMap["phospating"] ?? prev.phospatingRate,
          adhesiveRate: marginMap["adhesive"] ?? prev.adhesiveRate,
          paintingRate: marginMap["painting"] ?? prev.paintingRate,
          platingRate: marginMap["plating"] ?? prev.platingRate,
          cylindricalGrindingRate:
            marginMap["cylindrical grinding"] ?? prev.cylindricalGrindingRate,

          ...(urlTransactionId
            ? {}
            : {
                iccOnRm:
                  marginMap["icc"] !== undefined
                    ? String(marginMap["icc"])
                    : prev.iccOnRm,

                rejOnSubtotal:
                  marginMap["rejection"] !== undefined
                    ? String(marginMap["rejection"])
                    : prev.rejOnSubtotal,

                ohOnSubtotal:
                  marginMap["over head (o/h)"] !== undefined
                    ? String(marginMap["over head (o/h)"])
                    : prev.ohOnSubtotal,

                profitOnSubtotal:
                  marginMap["profit"] !== undefined
                    ? String(marginMap["profit"])
                    : prev.profitOnSubtotal,

                packagingOnSubtotal:
                  marginMap["packaging"] !== undefined
                    ? String(marginMap["packaging"])
                    : prev.packagingOnSubtotal,

                transportOnSubtotal:
                  marginMap["transport"] !== undefined
                    ? String(marginMap["transport"])
                    : prev.transportOnSubtotal,
              }),
        }));
      } catch (error) {
        console.error("Failed to load margin defaults:", error);
      }
    };

    fetchMargins();
  }, [urlTransactionId]);

  const fetchTransaction = async (id) => {
    try {
      const user = getUser();
      const userName = user?.user_name || user?.username || user?.name || "";
      if (!userName) {
        throw new Error(
          "Unable to identify the logged-in user. Please log in again.",
        );
      }
      const response = await fetch(
        `${API_BASE_URL}/molding/${id}?userName=${encodeURIComponent(userName)}`,
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load transaction");
      }
      const data = result.data;
      const status = String(data.status || "")
        .trim()
        .toUpperCase();

      setTransactionStatus(status);

      console.log("TRANSACTION STATUS:", status);

      setFormData((prev) => ({
        ...prev,
        // Database → Wizard
        financialYear: data.financial_year ?? prev.financialYear,
        month: data.month ?? prev.month,
        effectiveDate:
          formatDateForInput(data.effective_date) || prev.effectiveDate,
        customerName: data.customer_name ?? prev.customerName,
        productionUnit: data.production_unit ?? prev.productionUnit,
        billingUnit: data.billing_unit ?? prev.billingUnit,
        subDepartment: data.sub_department ?? prev.subDepartment,
        subCategory: data.sub_category ?? prev.subCategory,
        subCategoryName:
          data.sub_category_name ??
          data.subCategoryName ??
          prev.subCategoryName,
        partNo: data.part_no ?? prev.partNo,
        partName: data.part_name ?? prev.partName,
        fgcode: data.fg_code ?? prev.fgcode,
        imcode: data.im_code ?? prev.imcode,
        grossWeight: data.gross_weight ?? prev.grossWeight,
        netWeight: data.net_weight ?? prev.netWeight,
        loadingper: data.loading_per ?? prev.loadingper,
        hasBop: data.has_bop ?? prev.hasBop,
        polymerName: data.polymer_name ?? prev.polymerName,
        compoundCode: data.compound_code ?? prev.compoundCode,
        imCode: data.rm_im_code ?? prev.imCode,
        compMonth: data.comp_month ?? prev.compMonth,
        compoundRate: data.compound_rate ?? prev.compoundRate,
        totalRmCost: data.total_rm_cost ?? prev.totalRmCost,
        processType: data.process_type ?? prev.processType,
        machineTonnage: data.machine_tonnage ?? prev.machineTonnage,
        shiftRate: data.shift_rate ?? prev.shiftRate,
        totalCavity: data.total_cavity ?? prev.totalCavity,
        runningCavity: data.running_cavity ?? prev.runningCavity,
        cycleTime: data.cycle_time ?? prev.cycleTime,
        shiftTimeEfficiency:
          data.shift_time_efficiency == null
            ? ""
            : String(data.shift_time_efficiency),
        efficiency: data.efficiency ?? prev.efficiency,
        totalShots: data.total_shots ?? prev.totalShots,
        totalProductionPerShift:
          data.total_production_per_shift ?? prev.totalProductionPerShift,
        PlattenSize: data.platten_size ?? prev.PlattenSize,
        toolSize: data.tool_size ?? prev.toolSize,
        processCostA: data.process_cost_a ?? prev.processCostA,
        postCuring: data.post_curing ?? prev.postCuring,
        finishing: data.finishing ?? prev.finishing,
        inspection: data.inspection ?? prev.inspection,
        postCuringRequired: getOptionalProcessAnswer(
          data.post_curing ?? data.postCuring,
        ),
        finishingRequired: getOptionalProcessAnswer(data.finishing),
        inspectionRequired: getOptionalProcessAnswer(data.inspection),
        shotBlastingRequired: getOptionalProcessAnswer(
          data.shot_blasting ?? data.shotBlasting,
        ),
        vapourDegreasingRequired: getOptionalProcessAnswer(
          data.vapour_degreasing ?? data.vapourDegreasing,
        ),
        chromatingRequired: getOptionalProcessAnswer(data.chromating),
        phospatingRequired: getOptionalProcessAnswer(
          data.phospating ?? data.phosphating,
        ),
        adhesiveRequired: getOptionalProcessAnswer(data.adhesive),
        paintingRequired: getOptionalProcessAnswer(data.painting),
        platingRequired: getOptionalProcessAnswer(data.plating),
        cylindricalGrindingRequired: getOptionalProcessAnswer(
          data.cylindrical_grinding ?? data.cylindricalGrinding,
        ),
        shotBlasting:
          data.shot_blasting ?? data.shotBlasting ?? prev.shotBlasting,
        vapourDegreasing:
          data.vapour_degreasing ??
          data.vapourDegreasing ??
          prev.vapourDegreasing,
        chromating: data.chromating ?? prev.chromating,
        phospating: data.phospating ?? data.phosphating ?? prev.phospating,
        adhesive: data.adhesive ?? prev.adhesive,
        painting: data.painting ?? prev.painting,
        cylindricalGrinding:
          data.cylindrical_grinding ??
          data.cylindricalGrinding ??
          prev.cylindricalGrinding,
        plating: data.plating ?? prev.plating,
        bopWeight: data.bop_weight ?? data.bopWeight ?? prev.bopWeight,
        bopArea: data.bop_area ?? data.bopArea ?? prev.bopArea,
        paintArea: data.paint_area ?? data.paintArea ?? prev.paintArea,
        paintPerLit: data.paint_per_lit ?? data.paintPerLit ?? prev.paintPerLit,
        finishedPartWeight:
          data.finished_part_weight ??
          data.finishedPartWeight ??
          prev.finishedPartWeight,
        metalPartArea:
          data.metal_part_area ?? data.metalPartArea ?? prev.metalPartArea,
        assemblyQty: data.assembly_qty ?? prev.assemblyQty,
        assemblyPerCost: data.assembly_per_cost ?? prev.assemblyPerCost,
        totalAssemblyCost: data.total_assembly_cost ?? prev.totalAssemblyCost,
        processCostB: data.process_cost_b ?? prev.processCostB,
        conversionCost: data.conversion_cost ?? prev.conversionCost,
        partCost: data.part_cost ?? prev.partCost,
        customerSalesCost: data.customer_sales_cost ?? prev.customerSalesCost,
        salesProfitLoss: data.sales_profit_loss ?? prev.salesProfitLoss,
        buyingType: data.buying_type ?? prev.buyingType,
        vendorName: data.vendor_name ?? prev.vendorName,
        buyingCost: data.buying_cost ?? prev.buyingCost,
        buyingProfitLoss: data.buying_profit_loss ?? prev.buyingProfitLoss,
        monthlyQuantity: data.monthly_quantity ?? prev.monthlyQuantity,
        monthlyProfitLoss: data.monthly_profit_loss ?? prev.monthlyProfitLoss,
        iccOnRm: data.icc_on_rm ?? prev.iccOnRm,
        rejOnSubtotal: data.rej_on_subtotal ?? prev.rejOnSubtotal,
        ohOnSubtotal: data.oh_on_subtotal ?? prev.ohOnSubtotal,
        profitOnSubtotal: data.profit_on_subtotal ?? prev.profitOnSubtotal,
        packagingOnSubtotal:
          data.packaging_on_subtotal ?? prev.packagingOnSubtotal,
        transportOnSubtotal:
          data.transport_on_subtotal ?? prev.transportOnSubtotal,
        totalBopCost: data.total_bop_cost ?? prev.totalBopCost,
        finalRmCost: data.final_rm_cost ?? prev.finalRmCost,
        iccOnRmCost: data.icc_on_rm_cost ?? prev.iccOnRmCost,
        rejOnSubtotalCost: data.rej_on_subtotal_cost ?? prev.rejOnSubtotalCost,
        ohOnSubtotalCost: data.oh_on_subtotal_cost ?? prev.ohOnSubtotalCost,
        profitOnSubtotalCost:
          data.profit_on_subtotal_cost ?? prev.profitOnSubtotalCost,
        packagingOnSubtotalCost:
          data.packaging_on_subtotal_cost ?? prev.packagingOnSubtotalCost,
        transportOnSubtotalCost:
          data.transport_on_subtotal_cost ?? prev.transportOnSubtotalCost,
        subtotalA: data.subtotal_a ?? data.subtotalA ?? prev.subtotalA,
        subtotalB: data.subtotal_b ?? data.subtotalB ?? prev.subtotalB,
      }));

      setBops(
        (data.bops || []).map((bop, index) => ({
          // Permanent bop_part_details row ID
          id: bop.id ?? `saved-bop-${data.part_no || "part"}-${index}`,
          bopId: bop.bop_id ?? bop.bopId ?? "",
          bopFgCode: bop.bop_fg_code ?? bop.bop_erp_code ?? bop.bopFgCode ?? "",
          bopPartNo: bop.bop_part_no ?? bop.bopPartNo ?? "",
          bopPartName: bop.bop_part_name ?? bop.bopPartName ?? "",
          supplierId: bop.supplier_id ?? bop.supplierId ?? "",
          supplierName: bop.supplier_name ?? bop.supplierName ?? "",
          suppliers: Array.isArray(bop.suppliers)
            ? bop.suppliers
            : bop.supplier_id
              ? [
                  {
                    id: bop.supplier_id,
                    supplier_name: bop.supplier_name || "",
                  },
                ]
              : [],
          commodity: bop.commodity ?? "",
          bopAssemblyQty:
            bop.bop_assembly_qty ??
            bop.assembly_qty ??
            bop.bopAssemblyQty ??
            "",
          bopmonth: bop.bop_month ?? bop.bopmonth ?? "",
          bopRate: bop.bop_rate ?? bop.bopRate ?? "",
          bopCost: bop.bop_cost ?? bop.bopCost ?? "",
        })),
      );
    } catch (error) {
      console.error("Failed to load transaction:", error);
      alert(`Unable to load transaction: ${error.message}`);
    } finally {
    }
  };

  const saveDraft = async () => {
    try {
      const user = getUser();

      const userName = user?.user_name || user?.username || user?.name || "";

      if (!userName) {
        alert("Unable to identify the logged-in user. Please log in again.");
        return null;
      }
      const response = await fetch(`${API_BASE_URL}/molding/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transactionId || null,
          userName,
          formData: {
            ...formData,
            totalBopCost: totalBopCost.toFixed(2),
            finalRmCost: finalRmCost.toFixed(2),
            iccOnRmCost: iccOnRmCost.toFixed(2),
            rejOnSubtotalCost: rejOnSubtotalCost.toFixed(2),
            ohOnSubtotalCost: ohOnSubtotalCost.toFixed(2),
            profitOnSubtotalCost: profitOnSubtotalCost.toFixed(2),
            packagingOnSubtotalCost: packagingOnSubtotalCost.toFixed(2),
            transportOnSubtotalCost: transportOnSubtotalCost.toFixed(2),
            subtotalA: subtotalA.toFixed(2),
            subtotalB: subtotalB.toFixed(2),
            partCost: totalPartCost.toFixed(2),
            monthlyQuantity: Number(formData.monthlyQuantity) || 0,
            monthlyProfitLoss:
              (Number(formData.customerSalesCost) || 0) *
                Number(formData.monthlyQuantity || 0) -
              totalPartCost * Number(formData.monthlyQuantity || 0),
          },
          bops,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP Error ${response.status}`,
        );
      }
      if (!transactionId && data.transactionId) {
        setTransactionId(data.transactionId);
      }
      return data.transactionId || transactionId;
    } catch (error) {
      console.error("SAVE DRAFT ERROR:", error);
      alert(`Unable to save draft:\n${error.message}`);
      return null;
    }
  };

  const handleFinalSubmit = async () => {
    try {
      if (!transactionId) {
        alert("No draft transaction found.");
        return;
      }

      const user = getUser();
      const userName = user?.user_name || user?.username || user?.name || "";

      if (!userName) {
        alert("Unable to identify the logged-in user. Please log in again.");
        return;
      }

      // Save the latest costing data before final submission.
      const saved = await saveDraft();
      if (!saved) {
        return;
      }

      // Change DRAFT to FINAL.
      const response = await fetch(`${API_BASE_URL}/molding/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: saved,
          userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Final submit failed");
      }

      alert(`Costing submitted successfully: ${saved}`);
      console.log("Final:", data);
      navigate("/molding");
    } catch (error) {
      console.error("Final submit error:", error);
      alert(`Failed to submit costing: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // GROSS / NET WEIGHT
    if (name === "grossWeight" || name === "netWeight") {
      setFormData((prev) => {
        const grossWeight =
          name === "grossWeight"
            ? parseFloat(value)
            : parseFloat(prev.grossWeight);
        const netWeight =
          name === "netWeight" ? parseFloat(value) : parseFloat(prev.netWeight);
        let loadingper = "";
        if (!isNaN(grossWeight) && !isNaN(netWeight) && netWeight !== 0) {
          loadingper = (((grossWeight - netWeight) / netWeight) * 100).toFixed(
            2,
          );
        }
        // Calculate Total RM Cost
        let totalRmCost = "";
        const compoundRate = parseFloat(prev.compoundRate);
        if (!isNaN(grossWeight) && !isNaN(compoundRate)) {
          totalRmCost = ((grossWeight * compoundRate) / 1000).toFixed(2);
        }
        return {
          ...prev,
          [name]: value,
          loadingper: loadingper,
          totalRmCost: totalRmCost,
        };
      });
      return;
    }

    // COMPOUND COST
    if (name === "compoundRate") {
      setFormData((prev) => {
        const compoundRate = parseFloat(value);
        const loadingWeight = parseFloat(prev.grossWeight);
        let totalRmCost = "";
        if (!isNaN(compoundRate) && !isNaN(loadingWeight)) {
          totalRmCost = ((loadingWeight * compoundRate) / 1000).toFixed(2);
        }
        return {
          ...prev,
          compoundRate: value,
          totalRmCost: totalRmCost,
        };
      });

      return;
    }
    // process cost A
    if (
      name === "shiftTimeEfficiency" ||
      name === "cycleTime" ||
      name === "runningCavity"
    ) {
      setFormData((prev) => {
        const efficiency =
          name === "shiftTimeEfficiency"
            ? 60 * 8 * (parseFloat(value) / 100)
            : parseFloat(prev.efficiency);

        const cycleTime =
          name === "cycleTime" ? parseFloat(value) : parseFloat(prev.cycleTime);

        const runningCavity =
          name === "runningCavity"
            ? parseFloat(value)
            : parseFloat(prev.runningCavity);

        const shiftRate = parseFloat(prev.shiftRate);

        let totalShots = "";
        let totalProductionPerShift = "";
        let processCostA = "";

        // Total Shots = Efficiency / Cycle Time
        if (!isNaN(efficiency) && !isNaN(cycleTime) && cycleTime > 0) {
          totalShots = (efficiency / cycleTime).toFixed(2);
        }

        // Production = Running Cavity × Total Shots
        if (totalShots !== "" && !isNaN(runningCavity)) {
          totalProductionPerShift = (
            runningCavity * parseFloat(totalShots)
          ).toFixed(2);
        }

        if (
          !isNaN(shiftRate) &&
          totalShots !== "" &&
          !isNaN(runningCavity) &&
          runningCavity > 0 &&
          parseFloat(totalShots) > 0
        ) {
          processCostA = (
            shiftRate /
            parseFloat(totalShots) /
            runningCavity
          ).toFixed(2);
        }

        return {
          ...prev,
          [name]: value,

          ...(name === "shiftTimeEfficiency" && {
            efficiency: efficiency.toFixed(2),
          }),

          totalShots,
          totalProductionPerShift,
          processCostA,
        };
      });

      return;
    }
    // process cost B
    if (
      name === "postCuring" ||
      name === "finishing" ||
      name === "inspection" ||
      name === "shotBlasting" ||
      name === "vapourDegreasing" ||
      name === "chromating" ||
      name === "phospating" ||
      name === "adhesive" ||
      name === "painting" ||
      name === "cylindricalGrinding" ||
      name === "assemblyPerCost"
    ) {
      setFormData((prev) => {
        const postCuring =
          name === "postCuring"
            ? parseFloat(value) || 0
            : parseFloat(prev.postCuring) || 0;

        const finishing =
          name === "finishing"
            ? parseFloat(value) || 0
            : parseFloat(prev.finishing) || 0;

        const inspection =
          name === "inspection"
            ? parseFloat(value) || 0
            : parseFloat(prev.inspection) || 0;

        const shotBlasting =
          name === "shotBlasting"
            ? parseFloat(value) || 0
            : parseFloat(prev.shotBlasting) || 0;

        const vapourDegreasing =
          name === "vapourDegreasing"
            ? parseFloat(value) || 0
            : parseFloat(prev.vapourDegreasing) || 0;

        const chromating =
          name === "chromating"
            ? parseFloat(value) || 0
            : parseFloat(prev.chromating) || 0;

        const phospating =
          name === "phospating"
            ? parseFloat(value) || 0
            : parseFloat(prev.phospating) || 0;

        const adhesive =
          name === "adhesive"
            ? parseFloat(value) || 0
            : parseFloat(prev.adhesive) || 0;

        const painting =
          name === "painting"
            ? parseFloat(value) || 0
            : parseFloat(prev.painting) || 0;

        const cylindricalGrinding =
          name === "cylindricalGrinding"
            ? parseFloat(value) || 0
            : parseFloat(prev.cylindricalGrinding) || 0;

        const assemblyPerCost =
          name === "assemblyPerCost"
            ? parseFloat(value) || 0
            : parseFloat(prev.assemblyPerCost) || 0;

        // Assembly cost only when BOP = Yes
        const totalAssemblyCost =
          prev.hasBop === "Yes" ? totalAssemblyQty * assemblyPerCost : 0;

        // Process Cost B
        const processCostB =
          postCuring +
          finishing +
          inspection +
          shotBlasting +
          vapourDegreasing +
          chromating +
          phospating +
          adhesive +
          painting +
          cylindricalGrinding +
          totalAssemblyCost;

        return {
          ...prev,
          [name]: value,
          totalAssemblyCost: totalAssemblyCost.toFixed(2),
          processCostB: processCostB.toFixed(2),
        };
      });

      return;
    }
    // NORMAL INPUTS
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // LOAD SAVED BOP CONFIGURATION FOR SELECTED PART
  const loadBopConfiguration = async (partNo) => {
    const selectedPartNo = String(partNo || "").trim();

    // Clear previous part's BOP data
    setBops([]);

    if (!selectedPartNo) {
      setFormData((prev) => ({
        ...prev,
        hasBop: "",
        assemblyQty: "",
        totalAssemblyCost: "0.00",
      }));

      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/part-bops/${encodeURIComponent(selectedPartNo)}`,
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load BOP configuration");
      }

      const savedBops = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.bops)
            ? result.bops
            : [];

      /* NO BOP CONFIGURATION */
      if (savedBops.length === 0) {
        setBops([]);
        setFormData((prev) => ({
          ...prev,
          hasBop: "No",
          assemblyQty: "",
          totalAssemblyCost: "0.00",
        }));
        return;
      }

      /* LOAD BOP CONFIGURATION */

      const loadedBops = savedBops.map((bop, index) => ({
        id: bop.id ?? `saved-bop-${selectedPartNo}-${index}`,
        bopId: bop.bop_id ?? bop.bopId ?? "",
        bopFgCode: bop.bop_fg_code ?? bop.bop_erp_code ?? bop.bopFgCode ?? "",
        bopPartNo: bop.bop_part_no ?? bop.bopPartNo ?? "",
        bopPartName: bop.bop_part_name ?? bop.bopPartName ?? "",
        supplierId: bop.supplier_id ?? bop.supplierId ?? "",
        supplierName: bop.supplier_name ?? bop.supplierName ?? "",
        suppliers: Array.isArray(bop.suppliers)
          ? bop.suppliers
          : bop.supplier_id
            ? [
                {
                  id: bop.supplier_id,
                  supplier_name: bop.supplier_name || "",
                },
              ]
            : [],
        commodity: bop.commodity ?? "",
        bopAssemblyQty:
          bop.assembly_qty ?? bop.bop_assembly_qty ?? bop.bopAssemblyQty ?? "",
        bopmonth: bop.bop_month ?? bop.bopmonth ?? "",
        bopRate: bop.bop_rate ?? bop.bopRate ?? "",
        bopCost: bop.bop_cost ?? bop.bopCost ?? "0.00",
      }));

      setBops(loadedBops);

      setFormData((prev) => ({
        ...prev,

        hasBop: "Yes",
        assemblyQty: loadedBops
          .reduce((total, bop) => total + (Number(bop.bopAssemblyQty) || 0), 0)
          .toString(),
      }));
    } catch (error) {
      console.error("Error loading BOP configuration:", error);

      setBops([]);
      setFormData((prev) => ({
        ...prev,
        hasBop: "No",
        assemblyQty: "",
        totalAssemblyCost: "0.00",
      }));

      alert(
        `Unable to load BOP configuration for Part No ${selectedPartNo}: ${error.message}`,
      );
    }
  };

  const fetchSalesSameAsCompoundMonth = async ({
    partNo,
    financialYear,
    month,
  }) => {
    if (!partNo || !financialYear || !month) {
      return;
    }

    try {
      const url =
        `${API_BASE_URL}/sales-monthly/check?` +
        `partNo=${encodeURIComponent(partNo)}` +
        `&financialYear=${encodeURIComponent(financialYear)}` +
        `&month=${encodeURIComponent(month)}`;

      console.log("SALES SAME AS COMPOUND MONTH:", {
        partNo,
        financialYear,
        month,
      });

      console.log("SALES MONTH URL:", url);
      const response = await fetch(url);
      const result = await response.json();
      console.log("SALES MONTH RESPONSE:", result);
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch sales monthly");
      }

      if (!result.found || !result.data) {
        console.log("NO SALES FOUND FOR COMPOUND MONTH:", {
          partNo,
          financialYear,
          month,
        });

        setFormData((prev) => ({
          ...prev,
          customerSalesCost: "",
          monthlyQuantity: "",
        }));

        return;
      }

      console.log("SETTING SALES VALUES:", {
        month: result.data.month,
        sellRate: result.data.sell_rate,
        qty: result.data.qty,
      });

      setFormData((prev) => ({
        ...prev,
        customerSalesCost: result.data.sell_rate ?? "",
        monthlyQuantity: result.data.qty ?? "",
      }));
    } catch (error) {
      console.error("Sales monthly lookup error:", error);

      setFormData((prev) => ({
        ...prev,
        customerSalesCost: "",
        monthlyQuantity: "",
      }));
    }
  };

  const handlePartSelect = async (part) => {
    if (!part) {
      setBops([]);

      setFormData((prev) => ({
        ...prev,
        partNo: "",
        partName: "",
        fgcode: "",
        polymerName: "",
        compoundCode: "",
        imCode: "",
        compMonth: previousMonth,
        compoundRate: "",
        totalRmCost: "",
        hasBop: "",
        assemblyQty: "",
        totalAssemblyCost: "0.00",
      }));

      return;
    }

    // IM Code from PART MASTER
    const partImCode = part.im_code || part.imcode || "";

    // Update Part Details
    setFormData((prev) => ({
      ...prev,

      partNo: part.part_no || "",
      partName: part.part_name || "",
      fgcode: part.fg_code || "",
      imcode: prev.imcode || "",
      polymerName: "",
      compoundCode: "",
      imCode: "",
      compMonth: previousMonth,
      compoundRate: "",
      totalRmCost: "",
      hasBop: "",
      assemblyQty: "",
      totalAssemblyCost: "0.00",
    }));

    await loadBopConfiguration(part.part_no);

    if (!partImCode) {
      console.warn("Selected part does not have an IM Code");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/compound-by-im-code?imCode=${encodeURIComponent(
          partImCode,
        )}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch compound");
      }

      if (!result.found || !result.data) {
        console.warn("No compound found for IM Code:", partImCode);

        return;
      }

      const compound = result.data;

      setFormData((prev) => ({
        ...prev,
        polymerName: compound.polymer || "",
        compoundCode: compound.compound_code || "",
        imCode: compound.im_code || partImCode,
      }));
    } catch (error) {
      console.error("Error fetching compound by Part IM Code:", error);
    }
  };

  const totalAssemblyQty = bops.reduce(
    (total, bop) => total + (parseFloat(bop.bopAssemblyQty) || 0),
    0,
  );

  const totalBopCost = bops.reduce(
    (total, bop) => total + (Number(bop.bopCost) || 0),
    0,
  );

  const finalRmCost = (Number(formData.totalRmCost) || 0) + totalBopCost;
  const subtotalA = finalRmCost + (Number(formData.conversionCost) || 0);
  const iccOnRmCost = (finalRmCost * (Number(formData.iccOnRm) || 0)) / 100;
  const rejOnSubtotalCost =
    (subtotalA * (Number(formData.rejOnSubtotal) || 0)) / 100;
  const ohOnSubtotalCost =
    (subtotalA * (Number(formData.ohOnSubtotal) || 0)) / 100;
  const profitOnSubtotalCost =
    (subtotalA * (Number(formData.profitOnSubtotal) || 0)) / 100;
  const packagingOnSubtotalCost =
    (subtotalA * (Number(formData.packagingOnSubtotal) || 0)) / 100;
  const transportOnSubtotalCost =
    (subtotalA * (Number(formData.transportOnSubtotal) || 0)) / 100;
  const subtotalB =
    iccOnRmCost +
    rejOnSubtotalCost +
    ohOnSubtotalCost +
    profitOnSubtotalCost +
    packagingOnSubtotalCost +
    transportOnSubtotalCost;

  const totalPartCost = subtotalA + subtotalB;
  const customerSalesCost = Number(formData.customerSalesCost) || 0;
  const buyingCost = Number(formData.buyingCost) || 0;
  const salesProfitLoss = customerSalesCost - totalPartCost;
  const buyingProfitLoss = customerSalesCost - totalPartCost - buyingCost;

  useEffect(() => {
    const assemblyPerCost = parseFloat(formData.assemblyPerCost) || 0;
    const finishing = Number(formData.finishing) || 0;
    const inspection = Number(formData.inspection) || 0;
    const netWeight = Number(formData.netWeight) || 0;
    const bopWeight = Number(formData.bopWeight) || 0;
    const bopArea = Number(formData.bopArea) || 0;
    const paintArea = Number(formData.paintArea) || 0;
    const paintPerLit = Number(formData.paintPerLit) || 0;
    const finishedPartWeight = Number(formData.finishedPartWeight) || 0;
    const metalPartArea = Number(formData.metalPartArea) || 0;

    const postCuring =
      formData.postCuringRequired === "Yes"
        ? ((Number(formData.postCuringRate) || 0) * netWeight) / 1000
        : 0;
    const shotBlasting =
      formData.shotBlastingRequired === "Yes"
        ? (Number(formData.shotBlastingRate) || 0) * bopWeight
        : 0;
    const vapourDegreasing =
      formData.vapourDegreasingRequired === "Yes"
        ? (Number(formData.vapourDegreasingRate) || 0) * bopWeight
        : 0;
    const chromating =
      formData.chromatingRequired === "Yes"
        ? (Number(formData.chromatingRate) || 0) * bopWeight
        : 0;
    const phospating =
      formData.phospatingRequired === "Yes"
        ? (Number(formData.phospatingRate) || 0) * bopWeight
        : 0;
    const adhesive =
      formData.adhesiveRequired === "Yes"
        ? (Number(formData.adhesiveRate) || 0) * bopArea
        : 0;
    const painting =
      formData.paintingRequired === "Yes"
        ? (((Number(formData.paintingRate) || 0) * paintArea) / 1000) *
          paintPerLit
        : 0;
    const plating =
      formData.platingRequired === "Yes"
        ? ((Number(formData.platingRate) || 0) * finishedPartWeight)/1000
        : 0;
    const cylindricalGrinding =
      formData.cylindricalGrindingRequired === "Yes"
        ? (Number(formData.cylindricalGrindingRate) || 0) * metalPartArea
        : 0;
    const totalAssemblyCost =
      formData.hasBop === "Yes" ? totalAssemblyQty * assemblyPerCost : 0;

    const processCostB =
      finishing +
      inspection +
      postCuring +
      shotBlasting +
      vapourDegreasing +
      chromating +
      phospating +
      adhesive +
      painting +
      plating +
      cylindricalGrinding +
      totalAssemblyCost;

    const processCostA = parseFloat(formData.processCostA) || 0;
    // Total Conversion Cost
    const conversionCost = processCostA + processCostB;

    setFormData((prev) => ({
      ...prev,
      postCuring: postCuring.toFixed(2),
      shotBlasting: shotBlasting.toFixed(2),
      vapourDegreasing: vapourDegreasing.toFixed(2),
      chromating: chromating.toFixed(2),
      phospating: phospating.toFixed(2),
      adhesive: adhesive.toFixed(2),
      painting: painting.toFixed(2),
      plating: plating.toFixed(2),
      cylindricalGrinding: cylindricalGrinding.toFixed(2),
      totalAssemblyCost: totalAssemblyCost.toFixed(2),
      processCostB: processCostB.toFixed(2),
      conversionCost: conversionCost.toFixed(2),
    }));
  }, [
    totalAssemblyQty,
    formData.hasBop,
    formData.assemblyPerCost,
    formData.postCuringRequired,
    formData.finishing,
    formData.inspection,
    formData.postCuringRate,
    formData.netWeight,
    formData.bopWeight,
    formData.bopArea,
    formData.paintArea,
    formData.paintPerLit,
    formData.finishedPartWeight,
    formData.metalPartArea,
    formData.shotBlastingRequired,
    formData.shotBlastingRate,
    formData.vapourDegreasingRequired,
    formData.vapourDegreasingRate,
    formData.chromatingRequired,
    formData.chromatingRate,
    formData.phospatingRequired,
    formData.phospatingRate,
    formData.adhesiveRequired,
    formData.adhesiveRate,
    formData.paintingRequired,
    formData.paintingRate,
    formData.platingRequired,
    formData.platingRate,
    formData.cylindricalGrindingRequired,
    formData.cylindricalGrindingRate,
    formData.finishing,
    formData.inspection,
    formData.shotBlasting,
    formData.vapourDegreasing,
    formData.chromating,
    formData.phospating,
    formData.adhesive,
    formData.painting,
    formData.cylindricalGrinding,
    formData.processCostA,
  ]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      salesProfitLoss: salesProfitLoss.toFixed(2),
      buyingProfitLoss: buyingProfitLoss.toFixed(2),
    }));
  }, [customerSalesCost, buyingCost, totalPartCost]);

  useEffect(() => {
    if (!formData.partNo || !formData.financialYear || !formData.compMonth) {
      return;
    }
    fetchSalesSameAsCompoundMonth({
      partNo: formData.partNo,
      financialYear: formData.financialYear,
      month: formData.compMonth,
    });
  }, [formData.partNo, formData.financialYear, formData.compMonth]);

  const handleCompoundChange = (compound) => {
    setFormData((prev) => ({
      ...prev,
      compoundCode: compound.compound_code,
      imCode: compound.im_code || "",
    }));
  };

  const handlePolymerChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      polymerName: value,
      compoundCode: "",
      imCode: "",
    }));
  };

  const handleMachineChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      processType: value,
      machineTonnage: "",
      shiftRate: "",
    }));
  };

  const handleTonnageChange = (machine) => {
    setFormData((prev) => {
      const shiftRate = parseFloat(machine.shift_rate);
      const totalShots = parseFloat(prev.totalShots);
      const runningCavity = parseFloat(prev.runningCavity);

      let processCostA = "";

      if (
        !isNaN(shiftRate) &&
        !isNaN(totalShots) &&
        totalShots > 0 &&
        !isNaN(runningCavity) &&
        runningCavity > 0
      ) {
        processCostA = (shiftRate / totalShots / runningCavity).toFixed(2);
      }

      return {
        ...prev,
        machineTonnage: machine.machine_list,
        shiftRate: machine.shift_rate || "",
        processCostA: processCostA,
      };
    });
  };

  const createEmptyBop = () => ({
    id: Date.now() + Math.random(),
    bopId: "",
    bopFgCode: "",
    bopPartNo: "",
    bopPartName: "",
    supplierId: "",
    suppliers: [],
    commodity: "",
    bopAssemblyQty: "",
    bopmonth: previousMonth,
    bopRate: "",
    bopCost: "",
  });

  const handleBopChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      hasBop: value,

      ...(value === "No" && {
        assemblyPerCost: "",
        totalAssemblyCost: "0.00",
      }),
    }));

    if (value === "Yes" && bops.length === 0) {
      setBops([createEmptyBop()]);
    }

    if (value === "No") {
      setBops([]);
    }
  };

  const addBop = () => {
    setBops((prev) => [...prev, createEmptyBop()]);
  };

  // DELETE BOP
  const deleteBop = (id) => {
    setBops((prev) => prev.filter((bop) => bop.id !== id));
  };

  const fetchBopRate = async ({
    bopId,
    bopErpCode,
    supplierId,
    financialYear,
    month,
  }) => {
    try {
      // Use ERP code as the primary BOP identifier.
      const lookupCode = String(bopErpCode || "").trim();

      if (!lookupCode || !supplierId || !financialYear || !month) {
        console.log("Missing BOP lookup value:", {
          bopErpCode: lookupCode,
          supplierId,
          financialYear,
          month,
        });
        return null;
      }

      const params = new URLSearchParams({
        bopErpCode: lookupCode,
        supplierId: String(supplierId),
        financial_year: String(financialYear),
        month: String(month),
      });

      const url = `${API_BASE_URL}/bop-rate-for-costing?${params.toString()}`;
      console.log("BOP RATE URL:", url);
      const response = await fetch(url);
      const result = await response.json();
      console.log("BOP RATE RESPONSE:", result);
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch BOP rate");
      }

      if (!result.found) {
        console.log(
          "No monthly BOP rate found for:",
          lookupCode,
          supplierId,
          financialYear,
          month,
        );
        return null;
      }

      return Number(result.rate) || 0;
    } catch (error) {
      console.error("BOP RATE ERROR:", error);
      return null;
    }
  };

  const updateBop = async (id, field, value) => {
    const currentBop = bops.find((bop) => bop.id === id);
    if (!currentBop) return;

    // BOP MONTH CHANGED
    if (field === "bopmonth") {
      const bopErpCode =
        currentBop.bopFgCode ||
        currentBop.bop_erp_code ||
        currentBop.bopErpCode ||
        "";

      const supplierId = currentBop.supplierId;

      const rate = await fetchBopRate({
        bopId: currentBop.bopId,
        bopErpCode,
        supplierId,
        financialYear: formData.financialYear,
        month: value,
      });

      setBops((prev) =>
        prev.map((bop) => {
          if (bop.id !== id) return bop;
          const newRate = rate === null ? "" : rate;
          const qty = Number(bop.bopAssemblyQty) || 0;
          const cost =
            newRate === "" ? "0.00" : (qty * Number(newRate)).toFixed(2);

          return {
            ...bop,
            bopmonth: value,
            bopRate: newRate,
            bopCost: cost,
          };
        }),
      );
      return;
    }

    // ASSEMBLY QTY CHANGED
    if (field === "bopAssemblyQty") {
      setBops((prev) =>
        prev.map((bop) => {
          if (bop.id !== id) return bop;
          const qty = Number(value) || 0;
          const rate = Number(bop.bopRate) || 0;
          return {
            ...bop,
            bopAssemblyQty: value,
            bopCost: (qty * rate).toFixed(2),
          };
        }),
      );
      return;
    }

    // SUPPLIER CHANGED
    if (field === "supplierId") {
      setBops((prev) =>
        prev.map((bop) =>
          bop.id === id
            ? {
                ...bop,
                supplierId: value,
                bopRate: "",
                bopCost: "0.00",
              }
            : bop,
        ),
      );
      return;
    }

    // NORMAL FIELD
    setBops((prev) =>
      prev.map((bop) =>
        bop.id === id
          ? {
              ...bop,
              [field]: value,
            }
          : bop,
      ),
    );
  };

  const formatDateForInput = (value) => {
    if (!value) return "";

    // Already in HTML date format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };

  // NEXT
  const nextStep = async () => {
    // FINAL transaction = view only
    if (isViewMode) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
      }
      return;
    }

    // DRAFT transaction = save before moving
    const savedTransactionId = await saveDraft();

    if (!savedTransactionId) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  // PREVIOUS
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="costing-wizard-page">
      {/* Stepper */}

      {/* Stepper Header */}
      <div className="costing-wizard-stepper">
        <Stepper currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Wizard Content */}
      <div className="wizard-content">
        {currentStep === 1 && (
          <PartDetailsForm
            formData={formData}
            transactionId={transactionId}
            readOnly={isViewMode}
            handleInputChange={handleInputChange}
            handlePartSelect={handlePartSelect}
            handleBopChange={handleBopChange}
            bopList={bops}
            addBop={addBop}
            deleteBop={deleteBop}
            updateBop={updateBop}
          />
        )}

        {currentStep === 2 && (
          <RMDetailsForm
            formData={formData}
            transactionId={transactionId}
            readOnly={isViewMode}
            handleInputChange={handleInputChange}
            handleCompoundChange={handleCompoundChange}
            handlePolymerChange={handlePolymerChange}
            bopList={bops}
            updateBop={updateBop}
          />
        )}

        {currentStep === 3 && (
          <ProcessDetailsForm
            formData={formData}
            transactionId={transactionId}
            readOnly={isViewMode}
            handleInputChange={handleInputChange}
            handleMachineChange={handleMachineChange}
            handleTonnageChange={handleTonnageChange}
            totalAssemblyQty={totalAssemblyQty}
          />
        )}

        {currentStep === 4 && (
          <BottomLineForm
            formData={formData}
            transactionId={transactionId}
            readOnly={isViewMode}
            handleInputChange={handleInputChange}
            finalRmCost={finalRmCost}
            subtotalA={subtotalA}
            subtotalB={subtotalB}
            totalPartCost={totalPartCost}
          />
        )}
      </div>

      {/* Navigation Bar */}
      <div className="wizard-buttons-area">
        <WizardButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={previousStep}
          onNext={nextStep}
          onSaveDraft={saveDraft}
          onSubmit={handleFinalSubmit}
          readOnly={isViewMode}
        />
      </div>
    </div>
  );
}

export default CostingWizard;
