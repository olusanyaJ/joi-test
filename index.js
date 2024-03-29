const express = require("express");
const app = express();
const PORT = 8000;

app.use(express.json());

const fs = require("fs");

const Joi = require("joi");

const getAllMeals = () => {
  try {
    const allMeals = JSON.parse(fs.readFileSync("./data/meals.json"));
    return { status: "success", data: allMeals };
  } catch (error) {
    return { status: "error", message: "Error reading meals data" };
  }
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
  if (allMeals.status === "success") {
    res.status(200).json(allMeals);
  } else if (allMeals.status === "fail") {
    res.status(404).json(allMeals);
  } else {
    res.status(500).json(allMeals);
  }
});

app.get("/meals/:mealId", (req, res) => {
  const requestedMealId = req.params.mealId;

  if (!/^\d+$/.test(requestedMealId)) {
    return res.status(404).json({
      status: "fail",
      message: "Invalid input, Meal ID must contain only numbers.",
    });
  }

  const parsedRequestedMealId = parseInt(requestedMealId);

  if (isNaN(parsedRequestedMealId) || parsedRequestedMealId <= 0) {
    return res.status(404).json({
      status: "fail",
      message:
        "Invalid meal ID. Please provide a valid meal ID greater than 0.",
    });
  }

  const allMeals = getAllMeals();

  if (allMeals.status === "error") {
    return res.status(500).json({
      status: "error",
      message: "Error retrieving meals data.",
    });
  }

  const requestedMeal = allMeals.data.find((meal) => {
    return meal.mealId === parsedRequestedMealId;
  });

  if (!requestedMeal) {
    return res.status(404).json({
      status: "error",
      message: "Meal Not Found.",
    });
  }
  res.status(200).json({ status: "success", data: requestedMeal });
});

app.post("/meals", (req, res) => {
  try {
    const { error, value } = newMealSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map(
        (errorDetail) => errorDetail.message
      );

      return res.status(400).json({
        status: "fail",
        message: "Invalid input. Please check the provided data.",
        errors: errorMessages,
      });
    }

    const allMeals = getAllMeals();
    if (allMeals.status === "error") {
      return res.status(500).json({
        status: "error",
        message: "Error retrieving meals data.",
      });
    }

    const isMealNameUnique = allMeals.data.some(
      (meal) => meal.name === value.name
    );

    if (isMealNameUnique) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid input. A Meal with this name already exist",
      });
    }

    const newMeal = {
      mealId: allMeals.data.length + 1,
      name: value.name,
      description: value.description,
      ingredients: value.ingredients,
      instructions: value.instructions,
      image: value.image,
      nutrition: value.nutrition,
    };

    allMeals.data.push(newMeal);

    const stringifedMeal = JSON.stringify(allMeals.data);
    fs.writeFileSync("./data/meals.json", stringifedMeal);
    res.status(200).json({ status: "success", data: allMeals });
  } catch (error) {
    console.error("Error processing the request:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error.",
    });
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
