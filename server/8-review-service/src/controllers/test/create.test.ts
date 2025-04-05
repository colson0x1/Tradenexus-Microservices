import { Request, Response } from 'express';
import * as reviewService from '@review/services/review.service';
import { reviewMockRequest, reviewDocument, authUserPayload, reviewMockResponse } from '@review/controllers/test/mocks/review.mock';
import { review } from '@review/controllers/create';

jest.mock('@review/services/review.service');
jest.mock('@colson0x1/tradenexus-shared');
jest.mock('@review/queues/connection');
jest.mock('@elastic/elasticsearch');

describe('Review Controller', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // I want to test only this `review` method on create controller.
  describe('review method', () => {
    // what should this `review method` do is on this it block
    it('should return the correct response', async () => {
      const req: Request = reviewMockRequest({}, reviewDocument, authUserPayload) as unknown as Request;
      const res: Response = reviewMockResponse();
      // So what i need to do is, i need to spy on this `addReview` method because
      // it returns a `review` document of type `IReviewDocument`. So i spy on it
      // and then return a mock result value.
      // Because the `addReview` method returns a Promise so that is why im using
      // `mockResolvedValue` and the value i want to return is a review document.
      jest.spyOn(reviewService, 'addReview').mockResolvedValue(reviewDocument);

      await review(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Review created successfully.', review: reviewDocument });
    });
  });
});
