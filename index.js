const express = require("express");
const app = express();
const PORT = 8000;

const fs = require("fs");

const Joi = require("joi");

const getAllMeals = () => {
  const allMeals = JSON.parse(fs.readFileSync("./data/meals.json"));
  return allMeals;
};

app.get("/", (req, res) => {
  const allMeals = getAllMeals();
  res.status(200).send(allMeals);
});

app.get("/:mealId", (req, res) => {
  const requestedMealId = parseInt(req.params.mealId);
  const allMeals = getAllMeals();
  const requestedMeal = allMeals.find((meal) => {
    return meal.mealId === requestedMealId;
  });
  if (!requestedMeal) {
    return res.status(404).send("Meal Not Found");
  }
  res.status(200).send(requestedMeal);
});

app.post("/", (req, res) => {
  try {
    const allMeals = getAllMeals();
    const name = req.query.name;
    const description = req.query.description;
    const ingredients = JSON.parse(req.query.ingredients);
    const image = req.query.image;
    const instructions = JSON.parse(req.query.instructions);
    const nutrition = JSON.parse(req.query.nutrition);

    if (!name || !description || !ingredients || !instructions) {
      return res.send("Invalid meal object provided.");
    }

    const newMeal = {
      mealId: allMeals.length + 1,
      name: name,
      description: description,
      ingredients: ingredients,
      instructions: instructions,
      image: image,
      nutrition: nutrition,
    };

    Joi.object({
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
  console.log(`Listening on port ${PORT}`);
});

/* 
* use joi to do backend validation 

* Enpoints:
** GET all meals
** GET a meal by id
** POST a meal
*/
