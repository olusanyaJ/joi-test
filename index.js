const express = require("express");
const app = express();
const PORT = 8000;

app.use(express.json());

const fs = require("fs");

const Joi = require("joi");

const getAllMeals = () => {
  const allMeals = JSON.parse(fs.readFileSync("./data/meals.json"));
  return allMeals;
};

const newMealSchema = Joi.object({
  mealId: Joi.number().integer().min(12),
  name: Joi.string().required(),
  description: Joi.string().required(),
  ingredients: Joi.array().items(Joi.string()).required(),
  instructions: Joi.array().items(Joi.string()).required(),
  image: Joi.string(),
  nutrition: Joi.object({
    calories: Joi.number().integer(),
    protein: Joi.number().integer(),
    fat: Joi.number().integer(),
    carbohydrates: Joi.number().integer(),
    fiber: Joi.number().integer(),
    sugar: Joi.number().integer(),
    sodium: Joi.number().integer(),
  }),
})
  .with("name", "description")
  .with("ingredients", "instructions")
  .with("image", "nutrition");

app.get("/meals", (req, res) => {
  const allMeals = getAllMeals();
  res.status(200).send(allMeals);
});

app.get("/meals/:mealId", (req, res) => {
  const requestedMealId = req.params.mealId;

  if (!/^\d+$/.test(requestedMealId)) {
    return res.status(404).send("Invalid Meal ID. Must contain only numbers.");
  }
  const parsedRequestedMealId = parseInt(requestedMealId);

  if (parsedRequestedMealId <= 0) {
    return res.status(404).send("Enter a Meal ID greater than 0!");
  }

  const allMeals = getAllMeals();

  const requestedMeal = allMeals.find((meal) => {
    return meal.mealId === parsedRequestedMealId;
  });

  if (!requestedMeal) {
    return res.status(404).send("Meal Not Found");
  }
  res.status(200).send(requestedMeal);
});

app.post("/meals", (req, res) => {
  try {
    const { error, value } = newMealSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.log(error);
      return res.send(error.details);
    }

    const allMeals = getAllMeals();

    const newMeal = {
      mealId: allMeals.length + 1,
      name: value.name,
      description: value.description,
      ingredients: value.ingredients,
      instructions: value.instructions,
      image: value.image,
      nutrition: value.nutrition,
    };

    allMeals.push(newMeal);

    const stringifedMeal = JSON.stringify(allMeals);
    fs.writeFileSync("./data/meals.json", stringifedMeal);
    res.status(200).send(allMeals);
  } catch (error) {
    console.error("Error processing the request:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});

/* 
* use joi to do backend validation 

* Enpoints:
** GET all meals
** GET a meal by id
** POST a meal
*/
