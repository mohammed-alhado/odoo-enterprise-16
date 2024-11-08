# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.addons.marketing_automation.tests.common import MarketingAutomationCommon
from odoo.tests import tagged, users


@tagged("marketing_automation", "utm")
class TestMarketingCampaign(MarketingAutomationCommon):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.activity = cls._create_activity_mail(
            cls.campaign,
            user=cls.user_marketing_automation,
            act_values={
                'trigger_type': 'begin',
                'interval_number': 0, 'interval_type': 'hours',
            },
        )

    @users('user_marketing_automation')
    def test_duplicate_campaign(self):
        """ Test duplicating a campaign: should not duplicate traces
        and consider mailings as already sent through duplicates """
        original_campaign = self.campaign.with_user(self.env.user)
        duplicated_campaign = original_campaign.copy()
        for campaign in original_campaign + duplicated_campaign:
            with self.subTest(campaign=campaign.name):
                campaign.sync_participants()
                with self.mock_mail_gateway(mail_unlink_sent=False):
                    campaign.execute_activities()
                self.assertMarketAutoTraces(
                    [{
                        'status': 'processed',
                        'records': self.test_contacts,
                        'trace_status': 'sent',
                    }], campaign.marketing_activity_ids)

    @users('user_marketing_automation')
    def test_utm_source(self):
        """ Test source name modification and uniqueness check """
        # Setup
        campaign = self.campaign.with_user(self.env.user)
        utm_source_name = 'utm_source_without_mailing'
        campaign.marketing_activity_ids.mass_mailing_id.name = utm_source_name
        self.assertEqual(
            campaign.marketing_activity_ids.mass_mailing_id.name,
            utm_source_name,
        )

        # Remove template from campaign's activity (this leaves utm.source without mailing.mailing)
        campaign.marketing_activity_ids.mass_mailing_id.unlink()
        self.assertTrue(
            self.env['utm.source'].search([('name', '=', utm_source_name)]),
            "Test prerequisite: UTM source should still exists, even though it's not related to any campaigns"
        )

        # Create new campaign with an activity
        new_campaign = self.env['marketing.campaign'].create({
            'domain': [('name', 'like', 'MATest')],
            'model_id': self.env['ir.model']._get_id('mailing.contact'),
            'name': 'New Test Campaign',
        })
        self._create_activity_mail(
            new_campaign,
            user=self.user_marketing_automation,
            act_values={
                'trigger_type': 'begin',
                'interval_number': 0, 'interval_type': 'hours',
            },
        )
        # Reassign the original UTM source name to the new campaign (attempting to trigger unique name constraint)
        new_campaign.marketing_activity_ids.mass_mailing_id.name = utm_source_name
