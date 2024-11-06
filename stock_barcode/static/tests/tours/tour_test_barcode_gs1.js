/** @odoo-module **/

import helper from 'stock_barcode.tourHelper';
import tour from 'web_tour.tour';

// Inventory Tests.
tour.register('test_gs1_inventory_gtin_8', {test: true}, [
    {
        trigger: '.button_inventory',
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000082655853', // (01)00000082655853 -> GTIN-8 -> product barcode == 8265585
    },
    {
        trigger: '.o_barcode_client_action:contains("PRO_GTIN_8")',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
        }
    },
    {
        trigger: '.o_barcode_client_action:contains("PRO_GTIN_8")',
        run: 'scan 3777', // (37)77 -> add 77 Units to the selected product (the last one)
    },
    {
        trigger: '.o_barcode_line:contains("78")',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '78');
        }
    },
    {
        trigger: '.o_barcode_line .qty-done:contains("78")',
        run: 'scan O-BTN.validate',
    },
    {
        trigger: '.o_notification.border-success',
    },
]);

tour.register('test_gs1_inventory_product_units', {test: true}, [
    {
        trigger: '.button_inventory',
    },
    // The following scanned barcode should be decomposed like that:
    //      - (01)00000082655853    > product barcode (8265585)
    //      - (37)102               > units (102)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 010000008265585337102',
    },
    {
        trigger: '.o_barcode_client_action:contains("PRO_GTIN_8")',
    },
    {
        trigger: '.o_barcode_line:contains("102")',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '102');
        }
    },
    ...tour.stepUtils.validateBarcodeForm(),
]);

tour.register('test_gs1_inventory_lot_serial', {test: true}, [
    {
        trigger: '.button_inventory',
    },
    // The following scanned barcode should be decomposed like that:
    //      - (01)00111155555717    > tracked by lot product barcode (111155555717)
    //      - (10)LOT-AAA           > lot (LOT-AAA)
    //      - (30)5                 > quantity (5)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 010011115555571710LOT-AAA~305',
    },
    {
        trigger: '.o_barcode_line:contains("AAA")',
        run: function () {
            helper.assertLinesCount(1);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assert(line.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(line.querySelector('.o_line_lot_name').textContent, 'LOT-AAA');
            helper.assert(line.querySelector('.qty-done').textContent, '5');
        }
    },
    // Scans product + lot, and then scans the quantity after the line's creation.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 010011115555571710LOT-AAB',
    },
    // Unfolds the group and clicks on the right line to select it.
    { trigger: '.o_toggle_sublines .fa-caret-down' },
    { trigger: '.o_sublines .o_barcode_line:contains("AAB")' },
    {
        trigger: '.o_sublines .o_barcode_line.o_selected:contains("AAB")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(2);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '6');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'LOT-AAB');
            helper.assert(subline.querySelector('.qty-done').textContent, '1');
        }
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 30009',
    },
    {
        trigger: '.o_barcode_line.o_selected .qty-done:contains("10")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(2);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '15');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'LOT-AAB');
            helper.assert(subline.querySelector('.qty-done').textContent, '10');
        }
    },
    // Scans a second time a quantity (should increment the current line).
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 305',
    },
    {
        trigger: '.o_sublines .o_barcode_line.o_selected .qty-done:contains("15")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(2);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '20');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'LOT-AAB');
            helper.assert(subline.querySelector('.qty-done').textContent, '15');
        }
    },
    // Scans a lot + quantity (should get back the product from the previous
    // line and create a new line).
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 3020#10LOT-AAC',
    },
    {
        trigger: '.o_barcode_line.o_selected:contains("AAC")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(3);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '40');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'LOT-AAC');
            helper.assert(subline.querySelector('.qty-done').textContent, '20');
        }
    },
    // Scans lot + quantity but with a lot already scanned, so it should
    // increment the quantity on the line with this lot.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 300000000510LOT-AAA',
    },
    {
        trigger: '.o_barcode_line.o_selected .qty-done:contains("10")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(3);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.product-label').textContent, 'PRO_GTIN_12_lot');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '45');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'LOT-AAA');
            helper.assert(subline.querySelector('.qty-done').textContent, '10');
        }
    },

    // The following scanned barcode should be decomposed like that:
    //      - (01)15222222222219    > tracked by SN product barcode (15222222222219)
    //      - (21)Serial1           > serial number (Serial1)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 011522222222221921Serial1',
    },
    // Folds the previous line.
    { trigger: '.o_toggle_sublines .fa-caret-up' },
    {
        trigger: '.o_barcode_line:contains("Serial1")',
        run: function () {
            helper.assertLinesCount(2);
            helper.assertSublinesCount(0);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assert(line.querySelector('.product-label').textContent, 'PRO_GTIN_14_serial');
            helper.assert(line.querySelector('.o_line_lot_name').textContent, 'Serial1');
            helper.assert(line.querySelector('.qty-done').textContent, '1');
        }
    },
    // The following scanned barcode should be decomposed like that:
    //      - (01)15222222222219    > tracked by SN product barcode (15222222222219)
    //      - (21)Serial2           > serial number (Serial2)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 011522222222221921Serial2',
    },
    // Unfolds the group and clicks on the right line to select it.
    { trigger: '.o_barcode_line.o_selected .o_toggle_sublines .fa-caret-down' },
    { trigger: '.o_sublines .o_barcode_line:contains("Serial2")' },
    {
        trigger: '.o_barcode_line:contains("Serial2")',
        run: function () {
            helper.assertLinesCount(2);
            helper.assertSublinesCount(2);
        }
    },
    // Tries to scan multiple quantities for product tracked by SN, should set
    // the inventory qty. to 1 instead, and display a notification.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 011522222222221921Serial3\x1D3020',
    },
    {
        trigger: '.o_notification.border-danger',
    },
    {
        trigger: '.o_barcode_line:contains("Serial3")',
        run: function () {
            helper.assertLinesCount(2);
            helper.assertSublinesCount(3);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '3');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'Serial3');
            helper.assert(subline.querySelector('.qty-done').textContent, '1');
        }
    },
    // Tries to scan multiple quantities for product tracked by SN but without
    // a SN, should set the inventory qty. to the scanned one (20).
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01152222222222193020',
    },
    {
        trigger: '.o_sublines .o_barcode_line:nth-child(4)',
        run: function () {
            helper.assertLinesCount(2);
            helper.assertSublinesCount(4);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '23');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, '');
            helper.assert(subline.querySelector('.qty-done').textContent, '20');
        }
    },
    // Scans a serial number, it should not write it on the previous line (as
    // multiple quantitieswas scanned) and create a new one instead.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 011522222222221921Serial4',
    },
    {
        trigger: '.o_sublines .o_barcode_line:nth-child(5)',
        run: function () {
            helper.assertLinesCount(2);
            helper.assertSublinesCount(5);
            const parentLine = document.querySelector('.o_barcode_line.o_selected');
            const subline = document.querySelector('.o_sublines .o_barcode_line.o_selected');
            helper.assert(parentLine.querySelector('.qty-done').textContent, '24');
            helper.assert(subline.querySelector('.o_line_lot_name').textContent, 'Serial4');
            helper.assert(subline.querySelector('.qty-done').textContent, '1');
        }
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan O-BTN.validate',
    },
    // Ask for confirmation when validate because of quantities for tracked product without SN.
    {
        trigger: '.modal-content:contains("Tracked Products in Inventory Adjustment")',
    },
    {
        trigger: '.modal-content .btn[name=action_confirm]',
    },
    {
        trigger: '.o_notification.border-success',
    },
]);

tour.register('test_gs1_inventory_package', {test: true}, [
    { trigger: '.button_inventory' },
    // Scans the package in Section 1 => Should raise a warning.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 00987654123487568456',
    },
    {
        trigger: '.o_notification.border-danger'
    },
    // Changes location for Section 1 and scans again the package.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan LOC-01-01-00',
    },
    {
        trigger: '.o_scan_product:contains("WH/Stock/Section 1")',
        run: 'scan 00987654123487568456',
    },
    {
        trigger: '.o_barcode_line',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: 'product1'});
            const product1_package = $line.find('div[name="package"]').text().trim();
            helper.assert(product1_package, '987654123487568456');
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQuantityOnReservedQty(0, '8 / 8');
        },
    },

    // Changes location for Section 2 and scans the second package.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan LOC-01-02-00',
    },
    {
        trigger: '.o_scan_product:contains("WH/Stock/Section 2")',
        run: 'scan 00487325612456785124',
    },
    {
        trigger: '.o_barcode_line[data-barcode="product2"]',
        run: function () {
            helper.assertLinesCount(2);
            const $line = helper.getLine({barcode: 'product2'});
            const product2_package = $line.find('div[name="package"]').text().trim();
            helper.assert(product2_package, '487325612456785124');
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQuantityOnReservedQty(1, '6 / 6');
        },
    },
    // Tries to scan the same package => Should raise a warning.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 00487325612456785124',
    },
    {
        trigger: '.o_notification.border-danger'
    },

    // Scans additionnal products and put them in a new pack by scanning a non-existing package barcode.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000082655853304',
    },
    {
        trigger: '.o_barcode_line:nth-child(2)',
        run: 'scan 00122333444455555670',
    },
    {
        trigger: '.o_barcode_line:contains(122333444455555670)',
        run: function () {
            helper.assertLinesCount(3);
            const $line1 = helper.getLine({barcode: 'product2'});
            const line1_package = $line1.find('div[name="package"]').text().trim();
            helper.assertLineIsHighlighted($line1, false);
            helper.assert(line1_package, '487325612456785124');
            helper.assertLineQuantityOnReservedQty(1, '6 / 6');
            const $line2 = helper.getLine({barcode: '82655853'});
            const line2_package = $line2.find('div[name="package"]').text().trim();
            helper.assertLineIsHighlighted($line2, true);
            helper.assert(line2_package, '122333444455555670');
            helper.assertLineQty($line2, '4');
        },
    },

    // Validates the inventory.
    {
        trigger: '.o_apply_page'
    },
    {
        trigger: '.o_notification.border-success'
    }
]);

// Picking Tests.

tour.register('test_gs1_package_receipt', {test: true}, [
    { trigger: '.o_stock_barcode_main_menu:contains("Barcode Scanning")' },
    { trigger: '.o_stock_barcode_main_menu', run: 'scan WH-RECEIPTS' },
    // Scans PRO_GTIN_8 x4
    { trigger: '.o_barcode_client_action', run: 'scan 0100000082655853300004' },
    {
        trigger: '.o_barcode_line',
        run: function () {
            helper.assertLinesCount(1);
            const $line1 = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line1, true);
            helper.assertLineQty($line1, '4');
        }
    },
    // Scans a package => As it doesn't exist in the DB, should put in pack the
    // previously scanned quantities.
    { trigger: '.o_barcode_client_action', run: 'scan 00546879213579461324' },
    {
        trigger: '.o_barcode_line:contains(546879213579461324)',
        run: function () {
            helper.assertLinesCount(1);
            const $line1 = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line1, true);
            helper.assertLineQty($line1, '4');
            const product1_package = $line1.find('[name="package"]').text().trim();
            helper.assert(product1_package, '546879213579461324');
        }
    },
    // Scans PRO_GTIN_12 x8.
    { trigger: '.o_barcode_client_action', run: 'scan 300008\x1D0100584687955629' },
    {
        trigger: '.o_barcode_line:nth-child(2)',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineQty($line1, '4');
            const product1_package = $line1.find('[name="package"]').text().trim();
            helper.assert(product1_package, '546879213579461324');
            const $line2 = helper.getLine({barcode: '584687955629'});
            helper.assertLineIsHighlighted($line2, true);
            helper.assertLineQty($line2, '8');
        }
    },
    // Scans again the same package. Now it already exists but should be assigned anyway.
    { trigger: '.o_barcode_client_action', run: 'scan 00546879213579461324' },
    {
        trigger: '.o_barcode_line[data-barcode="584687955629"]:contains(546879213579461324)',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineQty($line1, '4');
            const product1_package = $line1.find('[name="package"]').text().trim();
            helper.assert(product1_package, '546879213579461324');
            const $line2 = helper.getLine({barcode: '584687955629'});
            helper.assertLineIsHighlighted($line2, true);
            helper.assertLineQty($line2, '8');
            const product2_package = $line2.find('[name="package"]').text().trim();
            helper.assert(product2_package, '546879213579461324');
        }
    },
    // Selects a line and scans a package type, it should be assing the package
    // type to selected line's result package.
    { trigger: '.o_barcode_line[data-barcode=584687955629]' },
    { trigger: '.o_selected[data-barcode=584687955629]', run: 'scan 91WOODC' },
    {
        trigger: '.o_barcode_line[data-barcode="584687955629"]:contains("(Wooden Chest)")',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '82655853'});
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineQty($line1, '4');
            const product1_package = $line1.find('[name="package"]').text().trim();
            helper.assert(product1_package, '546879213579461324 (Wooden Chest)');
            const $line2 = helper.getLine({barcode: '584687955629'});
            helper.assertLineIsHighlighted($line2, true);
            helper.assertLineQty($line2, '8');
            const product2_package = $line2.find('[name="package"]').text().trim();
            helper.assert(product2_package, '546879213579461324 (Wooden Chest)');
        }
    },

    // Scans PRO_GTIN_8 x6
    { trigger: '.o_barcode_client_action', run: 'scan 0100000082655853300006' },
    {
        trigger: '.o_barcode_line.o_selected:contains("PRO_GTIN_8")',
        run: function () {
            helper.assertLinesCount(3);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assertLineQty($(line), '6');
        }
    },
    // Scans a package with a type => put in pack the selected line in this package with the type.
    { trigger: '.o_barcode_client_action', run: 'scan 00130406658041178543\x1D91IRONC' },
    {
        trigger: '.o_barcode_line.o_selected:contains("130406658041178543")',
        run: function () {
            helper.assertLinesCount(3);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assertLineQty($(line), '6');
            const linePackage = line.querySelector('[name="package"]').innerText;
            helper.assert(linePackage, '130406658041178543 (Iron Chest)');
        }
    },
    // Scans PRO_GTIN_12 x12, then scans a package type to put in pack in a new package.
    { trigger: '.o_barcode_client_action', run: 'scan 30000000120100584687955629' },
    {
        trigger: '.o_barcode_line.o_selected[data-barcode="584687955629"]',
        run: function () {
            helper.assertLinesCount(4);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assertLineQty($(line), '12');
        }
    },
    { trigger: '.o_barcode_client_action', run: 'scan 91WOODC' },
    {
        trigger: '.o_barcode_line.o_selected[data-barcode="584687955629"] [name="package"]',
        run: function () {
            helper.assertLinesCount(4);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assertLineQty($(line), '12');
            const linePackage = line.querySelector('[name="package"]').innerText;
            helper.assert(linePackage, 'PACK0000123 (Wooden Chest)');
        }
    },
    // Scan another package type => Should change the package's type.
    { trigger: '.o_barcode_client_action', run: 'scan 91IRONC' },
    {
        trigger: '.o_selected[data-barcode="584687955629"] [name="package"]:contains("Iron Chest")',
        run: function () {
            helper.assertLinesCount(4);
            const line = document.querySelector('.o_barcode_line.o_selected');
            helper.assertLineQty($(line), '12');
            const linePackage = line.querySelector('[name="package"]').innerText;
            helper.assert(linePackage, 'PACK0000123 (Iron Chest)');
        }
    },
    ...tour.stepUtils.validateBarcodeForm(),
]);

tour.register('test_gs1_package_delivery', {test: true}, [
    { trigger: '.o_stock_barcode_main_menu:contains("Barcode Scanning")' },
    {
        trigger: '.o_stock_barcode_main_menu',
        run: 'scan WH-DELIVERY',
    },
    // Scans the package
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 00546879213579461324',
    },
    {
        trigger: '.o_barcode_line:nth-child(2)',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '82655853'});
            const product1_package = $line1.find('.package').text();
            const product1_result_package = $line1.find('.result-package').text();
            helper.assertLineIsHighlighted($line1, true);
            helper.assertLineQty($line1, '4');
            helper.assert(product1_package, '546879213579461324');
            helper.assert(product1_result_package, '546879213579461324');
            const $line2 = helper.getLine({barcode: '584687955629'});
            const product2_package = $line2.find('.package').text();
            const product2_result_package = $line2.find('.result-package').text();
            helper.assertLineIsHighlighted($line2, true);
            helper.assertLineQty($line2, '8');
            helper.assert(product2_package, '546879213579461324');
            helper.assert(product2_result_package, '546879213579461324');
        }
    },
    ...tour.stepUtils.validateBarcodeForm(),
]);

tour.register('test_gs1_reserved_delivery', {test:true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line, false);
            helper.assertLineQty($line, '0');
            helper.assertValidateIsHighlighted(false);
        }
    },
    // Scans 6 qty. of PRO_GTIN_8 (waiting for 10).
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019306',
    },
    {
        trigger: '.o_barcode_line .qty-done:contains(6)',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '6');
            helper.assertValidateIsHighlighted(false);
        }
    },
    // Scans 8 additional qty. of PRO_GTIN_8 (waiting for 10, so we have 4 extra).
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019308',
    },
    {
        trigger: '.o_barcode_line  .qty-done:contains(10)',
        run: function () {
            helper.assertLinesCount(2);
            const [line1, line2] = document.querySelectorAll('.o_barcode_line');
            helper.assertLineIsHighlighted($(line1), false);
            helper.assertLineIsHighlighted($(line2), true);
            helper.assertLineQty($(line1), '10');
            helper.assertLineQty($(line2), '4');
            helper.assertValidateIsHighlighted(true);
        }
    },
    // Validates the transfer.
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_delivery_ambiguous_lot_number', {test:true}, [
    // Create a delivery.
    { trigger: '.o_stock_barcode_main_menu_container', run: 'scan WH-DELIVERY' },
    // Scan the GS1 barcode (contains product + lot)
    {
        trigger: '.o_scan_message.o_scan_product',
        run: 'scan 0100000022222220152407101012345',
    },
    {
        trigger: '.o_barcode_line .qty-done:contains(1)',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '22222220'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
            helper.assert($line[0].querySelector('.o_line_lot_name').innerText, "12345");
        }
    },

    // Cancel the transfer and do the same but with packaging barcode instead.
    { trigger: '.o_barcode_client_action', run: 'scan O-CMD.cancel' },
    { trigger: '.o_stock_barcode_main_menu_container', run: 'scan WH-DELIVERY' },
    // Scan the GS1 barcode (contains product packaging + lot)
    {
        trigger: '.o_scan_message.o_scan_product',
        run: 'scan 0110000000240489152407101012345',
    },
    {
        trigger: '.o_barcode_line .qty-done:contains(1)',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '22222220'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
            helper.assert($line[0].querySelector('.o_line_lot_name').innerText, "12345");
        }
    },
    // Validates the transfer.
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_delivery_ambiguous_serial_number', {test:true}, [
    {
        trigger: '.o_barcode_client_action',
        run: 'scan LOC-01-00-00',
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01057115440019521524071021304',
    },
    {
        trigger: '.o_barcode_line .qty-done:contains(1)',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '05711544001952'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
        }
    },
    // Validates the transfer.
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_receipt_conflicting_barcodes_1', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line, false);
            helper.assertLineQty($line, '0');
            helper.assertValidateIsHighlighted(false);
        }
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019', // (01)00000011011019 product barcode (11011019)
    },
    {
        trigger: '.o_barcode_line.o_selected',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
            helper.assertValidateIsHighlighted(true);
        }
    },
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_receipt_conflicting_barcodes_2', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '000011011019'});
            helper.assertLineIsHighlighted($line, false);
            helper.assertLineQty($line, '0');
            helper.assertValidateIsHighlighted(false);
        }
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019', // (01)00000011011019 product barcode (000011011019)
    },
    {
        trigger: '.o_barcode_line.o_selected',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '000011011019'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '1');
            helper.assertValidateIsHighlighted(true);
        }
    },
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_receipt_conflicting_barcodes_3', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineQty($line1, '0');
            helper.assert($line1.find('.product-label').text(), 'PRO_GTIN_8');
            const $line2 = helper.getLine({barcode: '000011011019'});
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineQty($line2, '0');
            helper.assert($line2.find('.product-label').text(), 'PRO_GTIN_12');
            helper.assertValidateIsHighlighted(false);
        }
    },
    // Scans '0100000011011019', should get 'PRO_GTIN_8' as this is the product put in the lazy cache.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019',
    },
    {
        trigger: '.o_barcode_line.o_selected',
        run: function () {
            helper.assertLinesCount(2);
            const $line1 = helper.getLine({barcode: '11011019'});
            helper.assertLineIsHighlighted($line1, true);
            helper.assertLineQty($line1, '1');
            helper.assert($line1.find('.product-label').text(), 'PRO_GTIN_8');
            const $line2 = helper.getLine({barcode: '000011011019'});
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineQty($line2, '0');
            helper.assert($line2.find('.product-label').text(), 'PRO_GTIN_12');
            helper.assertValidateIsHighlighted(false);
        }
    },
    // Scans a second time '0100000011011019', should create a new line for PRO_GTIN_8.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000011011019',
    },
    {
        trigger: '.o_barcode_line:nth-child(3)',
        run: function () {
            helper.assertLinesCount(3);
            const [lineGTIN12, lineGTIN8_1, lineGTIN8_2] = document.querySelectorAll('.o_barcode_line');
            helper.assertLineIsHighlighted($(lineGTIN12), false);
            helper.assertLineQty($(lineGTIN12), '0');
            helper.assert(lineGTIN12.querySelector('.product-label').innerText, 'PRO_GTIN_12');
            helper.assertLineIsHighlighted($(lineGTIN8_1), false);
            helper.assertLineQty($(lineGTIN8_1), '1');
            helper.assert(lineGTIN8_1.querySelector('.product-label').innerText, 'PRO_GTIN_8');
            helper.assertLineIsHighlighted($(lineGTIN8_2), true);
            helper.assertLineQty($(lineGTIN8_2), '1');
            helper.assert(lineGTIN8_2.querySelector('.product-label').innerText, 'PRO_GTIN_8');
            helper.assertValidateIsHighlighted(false);
        }
    },
    // Scans the PRO_GTIN_12 (non-GS1) barcode: '000011011019'.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 000011011019',
    },
    {
        trigger: '.o_validate_page.btn-success',
        run: function () {
            helper.assertLinesCount(3);
            const $lines = helper.getLine({barcode: '11011019'});
            const $line1 = $($lines[0]);
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineQty($line1, '1');
            helper.assert($line1.find('.product-label').text(), 'PRO_GTIN_8');
            const $line2 = $($lines[1]);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineQty($line2, '1');
            helper.assert($line2.find('.product-label').text(), 'PRO_GTIN_8');
            const $line3 = helper.getLine({barcode: '000011011019'});
            helper.assertLineIsHighlighted($line3, true);
            helper.assertLineQty($line3, '1');
            helper.assert($line3.find('.product-label').text(), 'PRO_GTIN_12');
            helper.assertValidateIsHighlighted(true);
        }
    },
    {
        trigger: '.o_validate_page.btn-success',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_receipt_conflicting_barcodes_mistaken_as_gs1', {test: true}, [
    // Creates a new receipt.
    { trigger: ".o_stock_barcode_main_menu", run: "scan WH-RECEIPTS" },
    // Scans 3000000015 -> Will be parsed as 15 units by the GS1 nomenclature
    // but since we don't expect a quantity here (no line yet), it should also
    // check if this barcode matches something else (by-passing the nomenclature.)
    { trigger: ".o_barcode_client_action", run: "scan 3000000015" },
    {
        trigger: ".o_barcode_line",
        run: function() {
            const $line = helper.getLine({ barcode: "3000000015" });
            helper.assertLineQty($line, 1);
        },
    },
    // Scans 21000000000003 -> Will be parsed as a serial number by the GS1 nomenclature but since
    // it's irrelevant to scan a SN here (previous scanned product is not tracked), it should also
    // check if it's something else barcode (by-passing the nomenclature.)
    { trigger: ".o_barcode_client_action", run: "scan 21000000000003" },
    {
        trigger: ".o_barcode_line[data-barcode='21000000000003']",
        run: function() {
            const $line = helper.getLine({ barcode: "21000000000003" });
            helper.assertLineQty($line, 1);
        },
    },
    // Scans again 3000000015 but since it could genuinely be a quantity, we have no way to find if
    // it's really a GS1 or something else and use it as it was parsed.
    { trigger: ".o_barcode_client_action", run: "scan 3000000015" },
    {
        trigger: ".o_barcode_line.o_selected .qty-done:contains('16')",
        run: function() {
            const $line = helper.getLine({ barcode: "21000000000003" });
            // The qty of the selected product should be incremented by 15.
            helper.assertLineQty($line, 16);
        },
    },
    // Scans 21-Chouette-MegaPack whom can be interpreted as a lot (AI 21, lot name:
    // "-Chouette-MegaPack") but who is actually an existing package.
    { trigger: ".o_barcode_client_action", run: "scan 21-Chouette-MegaPack" },
    {
        trigger: ".o_barcode_line[data-barcode='21000000000003'] div[name='package']",
        run: function() {
            const $line = helper.getLine({ barcode: "21000000000003" });
            helper.assertLineQty($line, 16);
            helper.assert($line.find(".result-package").text(), "21-Chouette-MegaPack");
        },
    },
    // Now, scans a product tracked by SN and ensures the barcode starting by 21 are indeed
    // interpreted as serial number once a tracked product's waiting a SN.
    { trigger: ".o_barcode_client_action", run: "scan productserial1" },
    { trigger: ".o_barcode_line[data-barcode='productserial1']", run: "scan 21-Chouette-MegaPack" },
    {
        trigger: ".o_barcode_line.o_selected .o_line_lot_name",
        run: function() {
            const $line = helper.getLine({ barcode: "productserial1" });
            helper.assert($line.find(".o_line_lot_name").text(), "-Chouette-MegaPack");
        },
    },
    { trigger: ".o_barcode_client_action", run: "scan 21000000000003" },
    { trigger: ".o_barcode_line.o_selected .o_line_button.o_toggle_sublines" },
    {
        trigger: ".o_sublines .o_barcode_line.o_selected",
        run: function() {
            helper.assert(document.querySelector(".o_barcode_line_summary .qty-done").innerText, "2");
            helper.assert(
                document.querySelector(".o_sublines .o_selected .o_line_lot_name").innerText,
                "000000000003"
            );
        },
    },
])

tour.register('test_gs1_receipt_lot_serial', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '76543210'});
            helper.assertLineIsHighlighted($line, false);
            helper.assertLineQty($line, '0');
        }
    },
    // The following scanned barcode should be decomposed like that:
    //      - (01)00000076543210    > product barcode (76543210)
    //      - (30)00000008          > quantity (8)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000076543210\x1D3000000008',
    },
    {
        trigger: '.o_barcode_line.o_selected',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '76543210'});
            helper.assertLineIsHighlighted($line, true);
            helper.assertLineQty($line, '8');
        }
    },
    // Assign a lot to the previously scanned products:
    //      - (10)b1-b001           > lot (b1-b001)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 10b1-b001',
    },
    {
        trigger: '.o_barcode_line:contains("b1-b001")',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '76543210'});
            helper.assert($line.find('.o_line_lot_name').text(), 'b1-b001');
            helper.assertLineQty($line, '8');
        }
    },
    // Scan the product, lot and quantity all at once:
    //      - (01)00000076543210    > product barcode (76543210)
    //      - (10)b1-b002           > lot (b1-b002)
    //      - (30)00000004          > quantity (4)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 010000007654321010b1-b002\x1D3000000004',
    },
    { trigger: '.o_barcode_line.o_selected .btn.o_toggle_sublines .fa-caret-down' },
    {
        trigger: '.o_barcode_line:contains("b1-b002")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(2);
            const $parentLine = helper.getLine({barcode: '76543210'});
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            helper.assertLineQty($parentLine, '12');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '4');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, true);
        }
    },
    {
        trigger: '.o_sublines .o_barcode_line:nth-child(2).o_selected',
        run: 'scan 010000007654321010b1-b002\x1D3000000004',
    },
    {
        trigger: '.o_sublines .o_barcode_line.o_selected .qty-done:contains("8")',
        run: function () {
            helper.assertSublinesCount(2);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, true);
        }
    },
    // Scans a non-GS1 lot barcode to be sure it's compatible.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan b1-b003',
    },
    {
        trigger: '.o_barcode_line:contains("b1-b003")',
        run: function () {
            helper.assertSublinesCount(3);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '1');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, true);
        }
    },
    // Scan two more time the previous barcode...
    {
        trigger: '.o_barcode_client_action',
        run: 'scan b1-b003',
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan b1-b003',
    },
    {
        trigger: '.o_barcode_line.o_selected .qty-done:contains("3")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(3);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '3');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, true);
        }
    },
    // ... then scan a GS1 barcode to add 5 more qty., without lot reference,
    // to be sure the qty. will go on the last selected line.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 3000000005',
    },
    {
        trigger: '.o_sublines .o_barcode_line.o_selected:contains("8")',
        run: function () {
            helper.assertSublinesCount(3);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, true);
        }
    },
    // Adds a line with the "Add Product" button, then scans the lot/qty.
    { trigger: '.o_add_line' },
    {
        trigger: '.o_field_widget[name=product_id] input',
        run: 'text B1',
    },
    { trigger: ".ui-menu-item > a:contains('Battle Droid')" },
    {
        trigger: '[name=qty_done] input',
        run: 'text 0',
    },
    { trigger: '.o_save' },
    {
        trigger: '.o_barcode_line:nth-child(4)',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(4);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            const $line4 = helper.getSubline('.o_selected');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineQty($line4, '0');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, false);
            helper.assertLineIsHighlighted($line4, true);
        }
    },
    // The following scanned barcode should be decomposed like that:
    //      - (30)00000004          > quantity (4)
    //      - (10)b1-b004           > lot (b1-b004)
    //      - (01)00000076543210    > product barcode (76543210)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 3000000004\x1D10b1-b004\x1D0100000076543210',
    },
    {
        trigger: '.o_sublines .o_barcode_line:contains("b1-b004") .qty-done:contains("4")',
        run: function () {
            helper.assertSublinesCount(4);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            const $line4 = helper.getSubline(':contains("b1-b004")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineQty($line4, '4');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, false);
            helper.assertLineIsHighlighted($line4, true);
        }
    },
    // Scans only a lot => should create a new line with 1 qty.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 10b1-b005',
    },
    {
        trigger: '.o_sublines .o_barcode_line:contains("b1-b005") .qty-done:contains("1")',
        run: function () {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(5);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            const $line4 = helper.getSubline(':contains("b1-b004")');
            const $line5 = helper.getSubline(':contains("b1-b005")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineQty($line4, '4');
            helper.assertLineQty($line5, '1');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, false);
            helper.assertLineIsHighlighted($line4, false);
            helper.assertLineIsHighlighted($line5, true);
        }
    },
    // Now scans the quantity.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 3000007',
    },
    {
        trigger: '.o_sublines .o_barcode_line:contains("b1-b005") .qty-done:contains("8")',
        run: function () {
            helper.assertSublinesCount(5);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            const $line4 = helper.getSubline(':contains("b1-b004")');
            const $line5 = helper.getSubline(':contains("b1-b005")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineQty($line4, '4');
            helper.assertLineQty($line5, '8');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, false);
            helper.assertLineIsHighlighted($line4, false);
            helper.assertLineIsHighlighted($line5, true);
        }
    },
    // Scans a lot already in the view with additional qty. => Should select the
    // existing line for this lot and update its quantity done.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 10b1-b004\x1D3000000004',
    },
    {
        trigger: '.o_sublines .o_barcode_line.o_selected:contains("b1-b004")',
        run: function () {
            helper.assertSublinesCount(5);
            const $line1 = helper.getSubline(':contains("b1-b001")');
            const $line2 = helper.getSubline(':contains("b1-b002")');
            const $line3 = helper.getSubline(':contains("b1-b003")');
            const $line4 = helper.getSubline(':contains("b1-b004")');
            const $line5 = helper.getSubline(':contains("b1-b005")');
            helper.assertLineQty($line1, '8');
            helper.assertLineQty($line2, '8');
            helper.assertLineQty($line3, '8');
            helper.assertLineQty($line4, '8');
            helper.assertLineQty($line5, '8');
            helper.assertLineIsHighlighted($line1, false);
            helper.assertLineIsHighlighted($line2, false);
            helper.assertLineIsHighlighted($line3, false);
            helper.assertLineIsHighlighted($line4, true);
            helper.assertLineIsHighlighted($line5, false);
        }
    },
    {
        trigger: '.o_validate_page',
        run: 'scan O-BTN.validate',
    },
    { trigger: '.o_notification.border-success' }
]);

tour.register('test_gs1_receipt_quantity_with_uom', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(0);
        }
    },
    // Scans 5 kg for the "Product by Units" => Wrong UoM category, should display an error (instead of creating a new line)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152643293100000005',
    },
    {
        trigger: '.o_notification.border-danger',
        run: function () {
            helper.assertLinesCount(0);
            const errorMessageTitle = document.querySelector('.o_notification_title');
            helper.assert(errorMessageTitle.innerText, 'Wrong Unit of Measure');
        }
    },
    { trigger: '.o_notification_close' },
    // Scans 4 units for the "Product by Units".
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152643293700000004',
    },
    {
        trigger: '.o_barcode_line',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '15264329'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '4Units');
        }
    },
    // Scans 5 kg for the "Product by Units" => Wrong UoM category, should display an error (instead of updating the existing line)
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152643293100000005',
    },
    {
        trigger: '.o_notification.border-danger',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '15264329'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '4Units');
            const errorMessageTitle = document.querySelector('.o_notification_title');
            helper.assert(errorMessageTitle.innerText, 'Wrong Unit of Measure');
        }
    },
    { trigger: '.o_notification_close' },

    // Scans 5 kg for the "Product by kg".
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152648793100000005',
    },
    {
        trigger: '.o_barcode_line:contains("Product by kg")',
        run: function () {
            helper.assertLinesCount(2);
            const $line = helper.getLine({barcode: '15264879'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '5kg');
        }
    },
    // Scans 6 units for the "Product by kg" => Wrong UoM category, shoud display an error.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152648793700000006',
    },
    {
        trigger: '.o_notification.border-danger',
        run: function () {
            helper.assertLinesCount(2);
            const $line = helper.getLine({barcode: '15264879'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '5kg');
            const errorMessageTitle = document.querySelector('.o_notification_title');
            helper.assert(errorMessageTitle.innerText, 'Wrong Unit of Measure');
        }
    },
    { trigger: '.o_notification_close' },

    // Scans 1.25 kg for the "Product by g" => Compatible UoM but kg need to be converted to g.
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000152648933102000125',
    },
    {
        trigger: '.o_barcode_line:contains("Product by g")',
        run: function () {
            helper.assertLinesCount(3);
            const $line = helper.getLine({barcode: '15264893'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '1250g');
        }
    },
    // Clicks on the edit button to trigger a save.
    { trigger: '.o_barcode_line:nth-child(3) .o_edit' },
    {
        trigger: '[name=qty_done] input',
        run: function () {
            helper.assertFormQuantity("1250");
        }
    },
    ...tour.stepUtils.discardBarcodeForm(),
]);

tour.register('test_gs1_receipt_packaging', {test: true}, [
    {
        trigger: '.o_barcode_client_action',
        run: function () {
            helper.assertLinesCount(0);
        }
    },
    // Scans a packaging without any quantity
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 0100000000002226',
    },
    {
        trigger: '.o_barcode_line',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '1113'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '6');
        }
    },
    // Scans 4 packaging
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 01000000000022263700000004',
    },
    {
        trigger: '.o_barcode_line [name=quantity]:contains("30")',
        run: function () {
            helper.assertLinesCount(1);
            const $line = helper.getLine({barcode: '1113'});
            const $lineQty = $line.find('.fa-cube').parent();
            helper.assertLineIsHighlighted($line, true);
            helper.assert($lineQty.text().trim(), '30');
        }
    },
    // Clicks on the edit button to trigger a save.
    { trigger: '.o_barcode_line:first-child .o_edit' },
    {
        trigger: '[name="qty_done"] input',
        run: function () {
            helper.assertFormQuantity("30");
        }
    },
    ...tour.stepUtils.discardBarcodeForm(),
]);

tour.register('test_gs1_receipt_packaging_with_uom', {test: true}, [
    { trigger: ".o_stock_barcode_main_menu", run: "scan WH-RECEIPTS"},
    /* Scan (01)10347543011337(3103)000900(17)240701(10)100005
        - (01) 10347543011337: packaging barcode (6 units);
        - (3103) 000900: 0.9 kg -> Should be ignored;
        - (17) 240701: expiration date (1st July 2024);
        - (10) 100005: tracking number.
    */
    {
        trigger: ".o_barcode_client_action",
        run: "scan 011034754301133731030009001724070110100005"
    },
    {
        trigger: ".o_barcode_line",
        run: function() {
            helper.assert(document.querySelector('div[name="quantity"]').innerText, "6Units");
        }
    },
    /* Scan another lots with both quantity and weight.
        (01)03287890001332(10)92404603(17)240304(3103)001500(37)5
        - (01) 03287890001332: product barcode;
        - (10) 92404603: tracking number;
        - (17) 240304: expiration date (4th March 2024);
        - (3103) 001500: 1.5 kg -> Should be ignored;
        - (37) 5: 5 units -> Should be used as the line quantity.
        */
    {
        trigger: ".o_barcode_client_action",
        run: "scan 01032878900013321092404603\x1D172403043103001500375"
    },
    { trigger: ".o_toggle_sublines .fa-caret-down" },
    {
        trigger: ".o_toggle_sublines .fa-caret-up",
        run: function() {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(2);
            const $line1 = helper.getSubline(':eq(0)');
            const $line2 = helper.getSubline(':eq(1)');
            helper.assert($line1.find('.o_line_lot_name').text(), "100005");
            helper.assert($line1.find('div[name="quantity"]').text(), "6Units");
            helper.assert($line2.find('.o_line_lot_name').text(), "92404603");
            helper.assert($line2.find('div[name="quantity"]').text(), "5Units");
        }
    },
    // Same scenario but with scanning the packaging instead of the product, the weight should
    // still be ignored but the scanned quantity should multiply the packaging quantity.
    {
        trigger: ".o_barcode_client_action",
        run: "scan 011034754301133710123456\x1D172403043103001500375"
    },
    {
        trigger: ".o_barcode_line:nth-child(3)",
        run: function() {
            helper.assertLinesCount(1);
            helper.assertSublinesCount(3);
            const $line1 = helper.getSubline(':eq(0)');
            const $line2 = helper.getSubline(':eq(1)');
            const $line3 = helper.getSubline(':eq(2)');
            helper.assert($line1.find('.o_line_lot_name').text(), "100005");
            helper.assert($line1.find('div[name="quantity"]').text(), "6Units");
            helper.assert($line2.find('.o_line_lot_name').text(), "92404603");
            helper.assert($line2.find('div[name="quantity"]').text(), "5Units");
            helper.assert($line3.find('.o_line_lot_name').text(), "123456");
            // Package qty: 6; scanned qty: 5 -> Line qty = 6 x 5 = 30.
            helper.assert($line3.find('div[name="quantity"]').text(), "30Units");
        }
    },
]);

tour.register('test_gs1_tracked_packaging', {test: true}, [
    // Create a receipt and check non-existing lot is correctly scanned alongside the packaging.
    { trigger: '.o_stock_barcode_main_menu', run: "scan WH-RECEIPTS" },
    { trigger: '.o_barcode_client_action', run: "scan 020000001265325610lot-001" },
    {
        trigger: '.o_barcode_line',
        run: () => {
            helper.assertLinesCount(1);
            const $line = helper.getLine({ barcode: "productlot1" });
            helper.assertLineQty($line, "6", "Scanned packaging has quantity of 6");
            helper.assert($line.find('.product-label').text(), "productlot1");
            helper.assert($line.find('.o_line_lot_name').text(), "lot-001");
        },
    },
    { trigger: '.o_validate_page' },

    // Create a delivery and check existing lot is correctly found alongside the packaging.
    { trigger: '.o_stock_barcode_main_menu', run: "scan WH-DELIVERY" },
    { trigger: '.o_barcode_client_action', run: "scan 020000001265325610lot-001" },
    {
        trigger: '.o_barcode_line',
        run: () => {
            helper.assertLinesCount(1);
            const $line = helper.getLine({ barcode: "productlot1" });
            helper.assertLineQty($line, "6", "Scanned packaging has quantity of 6");
            helper.assert($line.find('.product-label').text(), "productlot1");
            helper.assert($line.find('.o_line_lot_name').text(), "lot-001");
        },
    },
    { trigger: '.o_validate_page' },
    { trigger: '.o_notification.border-success' },
]);

tour.register('test_gs1_tracked_lot', {test: true}, [
    // Create an inventory adjustment and scan a lot with the gs1 nomenclature
    {
        trigger: ".button_inventory",
    },
    {
        trigger: '.o_barcode_client_action',
        run: 'scan 1010032324016' // scan lot_name
    },
    {
        trigger: '.o_barcode_line',
        run: () => {
            helper.assertLinesCount(1);
            const $line = helper.getLine({ barcode: "productlot1" });
            helper.assertLineQty($line, "1", "Scanned lot has a quantity of 1");
            helper.assert($line.find('.product-label').text(), "productlot1");
            helper.assert($line.find('.o_line_lot_name').text(), "10032324016");
        },
    },
    { trigger: '.o_add_quantity', run: 'click' },
    {
        extra_trigger: '.o_barcode_line .qty-done:contains("2")',
        trigger: '.o_barcode_line',
        run: () => {
            helper.assertLinesCount(1);
            const $line = helper.getLine({ barcode: "productlot1" });
            helper.assertLineQty($line, "2", "units registerd");
            helper.assert($line.find('.product-label').text(), "productlot1");
            helper.assert($line.find('.o_line_lot_name').text(), "10032324016");
        },
    },
    { trigger: '.o_apply_page' },
    { trigger: '.o_notification.border-success' },
]);
