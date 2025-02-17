/* @ Seed controller to seed sellers data */

import { BadRequestError, IBuyerDocument, IEducation, IExperience, ISellerDocument } from '@colson0x1/tradenexus-shared';
import { faker } from '@faker-js/faker';
import { getRandomBuyers } from '@users/services/buyer.service';
import { createSeller, getSellerByEmail } from '@users/services/seller.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { floor, parseInt, random, sampleSize } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

// Actual Sellers/Seed method

const seed = async (req: Request, res: Response): Promise<void> => {
  const { count } = req.params;
  // Now get random buyers because those buyers have to be converted to sellers
  // since `count` is coming from `req.params`, its going to come as a string
  // so i need to cast it back to an integer
  // So here i want to get random buyers because its the buyers that will be
  // convereted to sellers
  const buyers: IBuyerDocument[] = await getRandomBuyers(parseInt(count, 10));
  // i want to loop through buyers so whatever is returned. so if we pass in
  // 10, this (i.e buyers) should be an array of 10 items.
  for (let i = 0; i < buyers.length; i++) {
    // So each buyer will be stored in this `buyer` property which equals to
    // `buyers` at index `i`
    const buyer: IBuyerDocument = buyers[i];
    // Check if the buyer that has been added has already been added as a seller
    // Here we get seller by email. So whatever buyer was selected, at least in
    // the first loop, we want to check if that buyer has already been converted
    // to a seller.
    const checkIfSellerExist: ISellerDocument | null = await getSellerByEmail(`${buyer.email}`);
    if (checkIfSellerExist) {
      // If it returns an object, that means the buyer already exists so
      // throw new bad request error
      throw new BadRequestError('Seller already exist.', 'SellerSeed seller() method error');
    }
    // But if buyer has not been created as a seller then, these are the
    // properties that we want to add to the database.
    // `seller.schema.ts`
    const basicDescription: string = faker.commerce.productDescription();
    const skills: string[] = [
      'Programming',
      'Web development',
      'Mobile development',
      'Proof reading',
      'UI/UX',
      'Data Science',
      'Financial modeling',
      'Data analysis'
    ];
    const seller: ISellerDocument = {
      profilePublicId: uuidv4(),
      fullName: faker.person.fullName(),
      username: buyer.username,
      email: buyer.email,
      country: faker.location.county(),
      profilePicture: buyer.profilePicture,
      // faker can generate very large basic description or less so i want to
      // check if its less than or equal to 250. if statement is true, then
      // use it otherwise slice it to first 250 characters
      description: basicDescription.length <= 250 ? basicDescription : basicDescription.slice(0, 250),
      oneliner: faker.word.words({ count: { min: 5, max: 10 } }),
      // randomly select using lodash from the `skills` defined above
      // first argument to sampleSize is the array and second argument is
      // how many. here im also doing the how many using sampleSize to randomly
      // select from skills array
      // sampleSize([1, 4]) will create a number between 1 and 4. And then here,
      // that is going to be the number of skills that wil be selected from this
      // skills array.
      skills: sampleSize(skills, sampleSize([1, 4])),
      // harcoding languages meaning this is going to be the same for every
      // user. If we want, we can create a list so that it randomly selects from
      // it. we can use the sampleSize, we can create a list just like how i
      // did it with skills above and then just use the sampleSize so that for
      // every loop, its going to randomly select the languages to use
      languages: [
        { language: 'English', level: 'Native' },
        { language: 'Spanish', level: 'Basic' },
        { language: 'German', level: 'Basic' }
      ],
      // faker has a price() method that returns a number or a string so i need
      // to convert it to an integer and then we can specify from which the
      // minimum and the maximum it should select from
      responseTime: parseInt(faker.commerce.price({ min: 1, max: 5, dec: 0 })),
      // So if this pass in faker commerce price returns 2, then its going to
      // add 2 experiences to the list. if its 3, its going to add 3 as well.
      // so here im setting the value between 2 and 4.
      experience: randomExperiences(parseInt(faker.commerce.price({ min: 2, max: 4, dec: 0 }))),
      education: randomEducation(parseInt(faker.commerce.price({ min: 2, max: 4, dec: 0 }))),
      // harcoded social links
      socialLinks: ['https://linkedin.com', 'https://twitter.com', 'https://instagram.com', 'https://youtube.com'],
      // last property im going to add is the certificates and im hardcoding
      // it as well
      // it can also be created to select randomly
      certificates: [
        {
          name: 'Flutter App Developer',
          from: 'Google Inc.',
          year: 2025
        },
        {
          name: 'iOS App Developer',
          from: 'Apple Inc.',
          year: 2020
        },
        {
          name: 'Android App Developer',
          from: 'Google Inc.',
          year: 2022
        }
      ]
    };

    await createSeller(seller);
  }

  res.status(StatusCodes.CREATED).json({ message: 'Sellers created successfully' });
};

// First two methods is going to be methods related to creating random
// experiences.
// So im going to create separate methods for `experience` and `education` as
// in `seller.schema.ts` and then use it in the main method.
// So i create those methods first before i create the actual sellers method
// to create the seeding

// Generates random experience
const randomExperiences = (count: number): IExperience[] => {
  const result: IExperience[] = [];
  for (let i = 0; i < count; i++) {
    // As in `experience` in `seller.schema.ts`, there are properties inside
    // experience objects like: company, title, startDate, endDate, description
    // and currentlyWorkinghere
    // I need to get those properties
    // Here im creating a const so that it randomly selects form the array
    const randomStartYear = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    // randomEndYear is going to be a string as in `seller.schema.ts`
    // If the user sets `currentlyWorkingHere` to true, then this `endDate`
    // will be a string and im going to set it to `present`.
    const randomEndYear = ['Present', '2025', '2026', '2027', '2028', '2029', '2030'];
    // Here using lodash method, or can be doing in manually using
    // `randomEndYear[Math.floor(Math.random(0.9)) * randomEndYear.length]`
    // So getting random item from an array
    const endYear = randomEndYear[floor(random(0.9) * randomEndYear.length)];
    const experience = {
      company: faker.company.name(),
      title: faker.person.jobTitle(),
      // startDate is going to be a string.
      // im using faker to create string of random month and random year
      startDate: `${faker.date.month()} ${randomStartYear[floor(random(0.9) * randomStartYear.length)]}`,
      //If endYear is equal to Present, its set to Present else i select a
      // random month and whatever endYear was selected
      endDate: endYear === 'Present' ? 'Present' : `${faker.date.month()} ${endYear}`,
      // get the first 100 characters
      description: faker.commerce.productDescription().slice(0, 100),
      /* currentlyWorkingHere: endYear === 'Present' ? true : false, */
      // shorthand
      currentlyWorkingHere: endYear === 'Present'
    };
    // push `experience` into the `result` array
    result.push(experience);
  }
  return result;
};

// Generates random education
const randomEducation = (count: number): IEducation[] => {
  const result: IEducation[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const education = {
      country: faker.location.county(),
      university: faker.company.bsBuzz(),
      title: faker.person.jobTitle(),
      major: `${faker.person.jobArea()} ${faker.person.jobDescriptor()}`,
      year: `${randomYear[floor(random(0.9) * randomYear.length)]}`
    };
    // push `education` into the `result` array
    result.push(education);
  }
  return result;
};

export { seed };
