import { autocompleteSriLankaLocations } from "../../services/location/locationService.js";
import { LOCATION_AUTOCOMPLETE_POLICY } from "../../constants/locationConstants.js";
import { consumeLocationAutocompleteRequest } from "../../services/location/locationRequestPolicyService.js";

// GET /api/location/autocomplete?text=...
// Returns Sri Lanka-focused location suggestions for typeahead search.
export const getLocationAutocomplete = async (req, res, next) => {
  try {
    const text = typeof req.query.text === "string" ? req.query.text.trim() : "";
    const limit = Number(req.query.limit) || 5;

    if (text.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    if (text.length > LOCATION_AUTOCOMPLETE_POLICY.maxQueryLength) {
      return res.status(400).json({
        success: false,
        message: `Location search text must not exceed ${LOCATION_AUTOCOMPLETE_POLICY.maxQueryLength} characters.`,
      });
    }

    const clientId = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || "unknown"}`;
    const budget = consumeLocationAutocompleteRequest(clientId);

    if (!budget.allowed) {
      res.set("Retry-After", String(budget.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: "Too many location lookup requests. Please try again later.",
      });
    }

    const result = await autocompleteSriLankaLocations({
      text,
      limit: Math.min(Math.max(limit, 1), LOCATION_AUTOCOMPLETE_POLICY.maxResults),
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};
