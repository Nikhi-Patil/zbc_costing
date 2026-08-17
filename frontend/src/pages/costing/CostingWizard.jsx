import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Stepper from "../../components/costing/Stepper";
import WizardButtons from "../../components/costing/WizardButtons";
import PartDetailsForm from "../../components/costing/PartDetailsForm";
import RMDetailsForm from "../../components/costing/RMDetailsForm";
import ProcessDetailsForm from "../../components/costing/ProcessDetailsForm";
import BottomLineForm from "../../components/costing/BottomLineForm";
import OutsourcingForm from "../../components/costing/OutsourcingForm";

function CostingWizard() {
  const { transactionId: urlTransactionId } = useParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [bops, setBops] = useState([]);
  const [transactionId, setTransactionId] = useState(urlTransactionId || "");

  const totalSteps = 5;
  const [loading, setLoading] = useState(false);

  // FORM DATA
  const [formData, setFormData] = useState({
    financialYear: "",
    month: "",
    effectiveDate: "",
    customerName: "",
    productionUnit: "",
    billingUnit: "",
    subDepartment: "",
    subCategory: "",
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
    compMonth: "",
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
    assemblyQty: "",
    assemblyPerCost: "",
    totalAssemblyCost: "",
    processCostB: "",
    conversionCost: "",

    partCost: "",
    sellCost: "",

    iccOnRm: "",
    rejOnSubtotal: "",
    ohOnSubtotal: "",
    profitOnSubtotal: "",
    packagingOnSubtotal: "",
    transportOnSubtotal: "",
    iccOnRmCost: "",
    rejOnSubtotalCost: "",
    ohOnSubtotalCost: "",
    profitOnSubtotalCost: "",
    packagingOnSubtotalCost: "",
    transportOnSubtotalCost: "",

    totalBopCost: "",
    finalRmCost: "",
  });

  useEffect(() => {
    if (!urlTransactionId) {
      return;
    }

    setTransactionId(urlTransactionId);
    fetchTransaction(urlTransactionId);
  }, [urlTransactionId]);

  const fetchTransaction = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/molding/${id}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Transaction not found");
      }
      const data = result.data || {};

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
        imCode: data.im_code ?? prev.imCode,
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
          data.shift_time_efficiency ?? prev.shiftTimeEfficiency,
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
        assemblyQty: data.assembly_qty ?? prev.assemblyQty,
        assemblyPerCost: data.assembly_per_cost ?? prev.assemblyPerCost,
        totalAssemblyCost: data.total_assembly_cost ?? prev.totalAssemblyCost,
        processCostB: data.process_cost_b ?? prev.processCostB,
        conversionCost: data.conversion_cost ?? prev.conversionCost,

        partCost: data.part_cost ?? prev.partCost,
        sellCost: data.sell_cost ?? prev.sellCost,

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
      }));

      setBops(
        (data.bops || []).map((bop) => ({
          id: bop.id,
          bopFgCode: bop.bop_fg_code || "",
          bopPartNo: bop.bop_part_no || "",
          bopPartName: bop.bop_part_name || "",
          supplierId: bop.supplier_id ?? "",
          suppliers: bop.suppliers || [],
          commodity: bop.commodity || "",
          bopAssemblyQty: bop.bop_assembly_qty ?? "",
          bopmonth: bop.bop_month || "",
          bopRate: bop.bop_rate ?? "",
          bopCost: bop.bop_cost ?? "",
        })),
      );
    } catch (error) {
      console.error("Failed to load transaction:", error);
      alert(`Unable to load transaction: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/molding/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transactionId || null,

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

            partCost: totalPartCost.toFixed(2),
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

      // Save latest step first
      const saved = await saveDraft();

      if (!saved) {
        return;
      }

      // Change DRAFT → FINAL
      const response = await fetch("http://localhost:5000/api/molding/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Final submit failed");
      }

      alert(`Costing submitted successfully: ${transactionId}`);

      console.log("Final:", data);
    } catch (error) {
      console.error("Final submit error:", error);
      alert("Failed to submit costing");
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

        const assemblyPerCost =
          name === "assemblyPerCost"
            ? parseFloat(value) || 0
            : parseFloat(prev.assemblyPerCost) || 0;

        // Assembly cost only when BOP = Yes
        const totalAssemblyCost =
          prev.hasBop === "Yes" ? totalAssemblyQty * assemblyPerCost : 0;

        // Process Cost B
        const processCostB =
          postCuring + finishing + inspection + totalAssemblyCost;

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

  const handlePartSelect = (part) => {
    setFormData((prev) => ({
      ...prev,
      partNo: part ? part.part_no : "",
      partName: part ? part.part_name : "",
      fgcode: part ? part.fg_code : "",
    }));
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
  const partCost = totalPartCost;

  useEffect(() => {
    const assemblyPerCost = parseFloat(formData.assemblyPerCost) || 0;

    const postCuring = parseFloat(formData.postCuring) || 0;

    const finishing = parseFloat(formData.finishing) || 0;

    const inspection = parseFloat(formData.inspection) || 0;

    const processCostA = parseFloat(formData.processCostA) || 0;

    // Total Assembly Cost
    const totalAssemblyCost =
      formData.hasBop === "Yes" ? totalAssemblyQty * assemblyPerCost : 0;

    // Process Cost B
    const processCostB =
      postCuring + finishing + inspection + totalAssemblyCost;

    // Total Conversion Cost
    const conversionCost = processCostA + processCostB;

    setFormData((prev) => ({
      ...prev,

      totalAssemblyCost: totalAssemblyCost.toFixed(2),

      processCostB: processCostB.toFixed(2),

      conversionCost: conversionCost.toFixed(2),
    }));
  }, [
    totalAssemblyQty,
    formData.hasBop,
    formData.assemblyPerCost,
    formData.postCuring,
    formData.finishing,
    formData.inspection,
    formData.processCostA,
  ]);

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

    bopFgCode: "",
    bopPartNo: "",
    bopPartName: "",

    supplierId: "",
    suppliers: [],

    commodity: "",
    bopAssemblyQty: "",

    bopmonth: "",
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
  // update BOP
  const updateBop = (id, field, value) => {
    setBops((prev) =>
      prev.map((bop) => {
        if (bop.id !== id) return bop;

        const updated = {
          ...bop,
          [field]: value,
        };

        // BOP Cost = Assembly Qty × BOP Rate
        if (field === "bopAssemblyQty" || field === "bopRate") {
          const qty =
            Number(field === "bopAssemblyQty" ? value : bop.bopAssemblyQty) ||
            0;

          const rate = Number(field === "bopRate" ? value : bop.bopRate) || 0;

          updated.bopCost = (qty * rate).toFixed(2);
        }

        return updated;
      }),
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

    // Use local date so 18:30 UTC becomes the correct
    // calendar date in Asia/Kolkata.
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };
  // NEXT
  const nextStep = async () => {
    // Save current page before going to next page
    const savedTransactionId = await saveDraft();

    // Don't move if saving failed
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
      <div className="costing-wizard-stepper">
        <Stepper currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Wizard Content */}
      <div className="wizard-content">
        {currentStep === 1 && (
          <PartDetailsForm
            formData={formData}
            transactionId={transactionId}
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
            handleInputChange={handleInputChange}
            finalRmCost={finalRmCost}
            subtotalA={subtotalA}
            subtotalB={subtotalB}
            totalPartCost={totalPartCost}
          />
        )}

        {currentStep === 5 && (
          <OutsourcingForm
            formData={formData}
            transactionId={transactionId}
            handleInputChange={handleInputChange}
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
        />
      </div>
    </div>
  );
}

export default CostingWizard;
