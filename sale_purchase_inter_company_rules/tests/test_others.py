from .common import TestInterCompanyRulesCommonSOPO
from odoo import Command
from odoo.tests import tagged


@tagged('-at_install', 'post_install')
class TestInterCompanyOthers(TestInterCompanyRulesCommonSOPO):

    def test_00_auto_purchase_on_normal_sales_order(self):
        partner1 = self.env['res.partner'].create({'name': 'customer', 'email': 'from.customer@example.com'})
        my_service = self.env['product.product'].create({
            'name': 'my service',
            'type': 'service',
            'service_to_purchase': True,
            'seller_ids': [(0, 0, {
                'partner_id': self.company_a.partner_id.id,
                'min_qty': 1,
                'price': 10,
                'product_code': 'C01',
                'product_name': 'Name01',
                'sequence': 1,
            })]
        })
        so = self.env['sale.order'].create({
            'partner_id': partner1.id,
            'order_line': [
                (0, 0, {
                    'name': my_service.name,
                    'product_id': my_service.id,
                    'product_uom_qty': 1,
                })
            ],
        })
        # confirming the action from the test will use Odoobot which results in the same flow as
        # confirming the SO from an email link
        so.action_confirm()

        po = self.env['purchase.order'].search([('partner_id', '=', self.company_a.partner_id.id)], order='id desc',
                                               limit=1)
        self.assertEqual(po.order_line.name, "[C01] Name01")

    def test_auto_purchase_on_inter_company_so(self):
        """ Create a SO for another company with a subcontracted service in a synchronized Inter-Company environment.
        A PO should be created for the other company from the Inter-Company synchronization and a PO should also be
        created for the subcontracted service.
        """
        self.company_a.update({
            'rule_type': 'sale_purchase',
            'auto_validation': True,
        })
        self.company_b.update({
            'rule_type': 'sale_purchase',
            'auto_validation': True,
        })
        partner_a = self.env['res.partner'].create({
            'name': 'partner_a',
            'company_id': False,
        })
        # Create a subcontracted service product with partner_a as seller
        service_xyz = self.env['product.product'].create({
            'name': 'Service XYZ',
            'type': 'service',
            'service_to_purchase': True,
            'seller_ids': [
                Command.create({
                    'partner_id': partner_a.id,
                    'price': 100.0,
                }),
            ]
        })
        # Create a SO for company_b from company_a
        so = self.env['sale.order'].create({
            'company_id': self.company_a.id,
            'partner_id': self.company_b.partner_id.id,
            'order_line': [
                Command.create({
                    'product_id': service_xyz.id,
                    'price_unit': 200.0,
                    'product_uom_qty': 1,
                }),
            ],
        })
        so.action_confirm()

        po_company_a = self.env['purchase.order'].search([('partner_id', '=', self.company_a.partner_id.id)])
        self.assertEqual(len(po_company_a), 1)
        self.assertEqual(po_company_a.company_id, self.company_b)
        self.assertEqual(po_company_a.order_line[0].price_unit, 200.0)
        self.assertEqual(po_company_a.order_line[0].product_qty, 1)

        po_partner_a = self.env['purchase.order'].search([('partner_id', '=', partner_a.id)])
        self.assertEqual(len(po_partner_a), 1)
        self.assertEqual(po_partner_a.company_id, self.company_a)
        self.assertEqual(po_partner_a.order_line[0].price_unit, 100.0)
        self.assertEqual(po_partner_a.order_line[0].product_qty, 1)
