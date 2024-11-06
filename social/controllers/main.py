# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import http
from odoo.http import request
from werkzeug.exceptions import Forbidden


class SocialValidationException(Exception):
    pass


class SocialController(http.Controller):

    def _get_social_stream_post(self, stream_post_id, media_type):
        """ Small utility method that fetches the post and checks it belongs
        to the correct media_type """
        stream_post = request.env['social.stream.post'].search([
            ('id', '=', stream_post_id),
            ('stream_id.account_id.media_id.media_type', '=', media_type),
        ])
        if not stream_post:
            raise Forbidden()

        return stream_post
