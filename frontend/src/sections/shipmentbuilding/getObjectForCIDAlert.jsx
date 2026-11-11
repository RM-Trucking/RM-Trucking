export const getObjectDorCIDAlert = (getValues, consolidatedFilterObj, selectedDeliveryDetailsList, selectedShipmentObjects,
    carrierTerminalDropdown, watchedCarrierInfo
) => {
    const currentValues = getValues();
    let obj = {};
    obj.date = formatDate(new Date()),
        obj.labelCount = selectedDeliveryDetailsList?.length;
    const [linehaulTerminalId, linehaulCarrierId] = currentValues?.carrierInfo?.lineHaul?.carrier?.split('-');
    const selectedLinehaulCarrierObject = carrierTerminalDropdown.find(
        (item) => item.terminalId === Number(linehaulTerminalId) && item.carrierId === Number(linehaulCarrierId)
    );
    obj.pickupCompany = selectedLinehaulCarrierObject?.carrierName;
    const addressObj = selectedLinehaulCarrierObject?.address;
    const linehaulAddressString = addressObj
        ? [
            addressObj.addressLine1,
            addressObj.addressLine2,
            addressObj.city,
            addressObj.state,
            addressObj.zipCode
        ]
            .filter(Boolean) // Automatically removes null, undefined, or empty strings
            .join(', ')     // Joins the remaining parts with a comma and space
        : '';
    obj.pickupAddress = linehaulAddressString;
    obj.mawb = currentValues?.carrierInfo?.lineHaul?.billNumber;
    obj.rdyDate = formatInputDate(currentValues?.carrierInfo?.lineHaul?.etaDate);
    const lh = currentValues?.carrierInfo?.lineHaul;
    obj.totalPcsWeight = (lh?.pcs && lh?.weight)
        ? `${lh.pcs} @ ${lh.weight} lbs`
        : '';
    const [delTerminalId, delCarrierId] = selectedDeliveryDetailsList?.[0]?.carrier?.split('-');
    const selectedDeliveryFromTerminal = carrierTerminalDropdown?.find(
        (item) => item?.carrierId === Number(delCarrierId) && item?.terminalId === Number(delTerminalId)
    ) || null;
    obj.agentName = selectedDeliveryFromTerminal?.carrierName;
    const delAddressObj = selectedDeliveryFromTerminal?.address;
    const delAddressString = delAddressObj
        ? [
            addressObj.addressLine1,
            addressObj.addressLine2,
            addressObj.city,
            addressObj.state,
            addressObj.zipCode
        ]
            .filter(Boolean) // Automatically removes null, undefined, or empty strings
            .join(', ')     // Joins the remaining parts with a comma and space
        : '';
    obj.agentNoa = "";
    obj.agentFax = "";
    obj.agentCityState = delAddressString;

    const deliveryItems = (watchedCarrierInfo?.deliveryDetailsList || []).map((item) => {
        // 1. Combine pieces and weight cleanly (only add text if data exists)
        const pcsWeight = (item?.pcs && item?.weight)
            ? `${item.pcs} @ ${item.weight} lbs`
            : item?.pcs || item?.weight || '';

        // 2. Format the delivery address from the manualToLocationDetails object
        const addr = item?.manualToLocationDetails;
        const addressLine = addr
            ? [addr.line1, addr.line2, addr.city, addr.state, addr.zip]
                .filter(Boolean) // Drops any null, undefined, or empty strings
                .join(', ')
            : '';

        // 3. Compile notes with accessorial requirements appended
        let combinedNotes = item?.deliveryNotes || '';

        if (Array.isArray(item?.deliveryAccessorials) && item.deliveryAccessorials.length > 0) {
            const accessorialRequirements = item.deliveryAccessorials
                .map(acc => acc?.accessorialName ? `${acc.accessorialName} is required.` : '')
                .filter(Boolean)
                .join(' ');

            if (accessorialRequirements) {
                // Append the requirements cleanly with a trailing space separator
                combinedNotes = combinedNotes
                    ? `${combinedNotes} | ${accessorialRequirements}`
                    : accessorialRequirements;
            }
        }

        // 4. Return the beautifully mapped object matching your print template keys
        return {
            hawb: item?.billNumber || '',
            pcsWeight: pcsWeight,
            deliveryName: item?.toLocation || '',
            addressLine: addressLine,
            contactPhone: '', // Left blank as specified
            notes: combinedNotes
        };
    });
    obj.deliveryItems = deliveryItems;
    return obj;
};
const formatDate = (dateObj) => {
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');

    // Gets the current 4-digit year (e.g., 2026)
    const yyyy = dateObj.getFullYear();

    return `${mm}/${dd}/${yyyy}`;
};
const formatInputDate = (dateStr) => {
    if (!dateStr) return '';

    // Split "2026-10-22" into ["2026", "10", "22"]
    const [year, month, day] = dateStr.split('-');

    // Return in MM/DD/YYYY format
    return `${month}/${day}/${year}`;
};