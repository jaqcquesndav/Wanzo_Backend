"use strict";

const { Contract } = require("fabric-contract-api");

class AnchoringContract extends Contract {
  async instantiate(ctx) {
    // For Fabric v1 style instantiate; Fabric v2+ uses Init via endorsement policy
    return "OK";
  }

  async InitLedger(ctx) {
    // No-op starter
    return "OK";
  }

  // Anchor a reference with raw payload (e.g., hash, metadata)
  async Anchor(ctx, refId, payloadJson) {
    if (!refId) throw new Error("refId is required");
    if (!payloadJson) throw new Error("payloadJson is required");

    const exists = await this._exists(ctx, refId);
    if (exists) throw new Error(`refId already anchored: ${refId}`);

    // Attach metadata about creator and timestamp
    const txTs = ctx.stub.getTxTimestamp();
    const tsMs = (txTs.seconds.low * 1000) + Math.round(txTs.nanos / 1e6);
    const creator = this._getCreator(ctx);
    let payload;
    try {
      payload = JSON.parse(payloadJson);
    } catch (e) {
      throw new Error("payloadJson must be valid JSON");
    }
    const record = {
      refId,
      type: payload?.type || "generic",
      cid: payload?.cid || null,
      sha256: payload?.sha256 || null,
      payload,
      creator,
      txId: ctx.stub.getTxID(),
      tsMs,
    };
    await ctx.stub.putState(refId, Buffer.from(JSON.stringify(record)));
    return JSON.stringify({ ok: true, refId, txId: record.txId, tsMs });
  }

  // Anchor a simple tuple (refId,type,cid,sha256)
  async AnchorCID(ctx, refId, type, cid, sha256) {
    const payload = { type, cid, sha256 };
    return await this.Anchor(ctx, refId, JSON.stringify(payload));
  }

  async Verify(ctx, refId) {
    if (!refId) throw new Error("refId is required");
    const data = await ctx.stub.getState(refId);
    if (!data || data.length === 0) {
      return JSON.stringify({ ok: false, exists: false });
    }
    const record = JSON.parse(data.toString());
    return JSON.stringify({ ok: true, exists: true, record });
  }

  async Get(ctx, refId) {
    if (!refId) throw new Error("refId is required");
    const data = await ctx.stub.getState(refId);
    if (!data || data.length === 0) throw new Error("not found");
    return data.toString();
  }

  async _exists(ctx, id) {
    const data = await ctx.stub.getState(id);
    return data && data.length > 0;
  }

  _getCreator(ctx) {
    const cid = ctx.clientIdentity;
    return {
      mspId: cid.getMSPID(),
      id: cid.getID(),
      attrs: cid.getAttributeValue ? undefined : undefined,
    };
  }
}

module.exports.contracts = [AnchoringContract];
