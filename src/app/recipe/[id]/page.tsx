import React, { FC } from "react";

interface RecipeDetailPageProps {
  params: {
    id: string;
  };
}
const RecipeDetailPage: FC<RecipeDetailPageProps> = ({ params }) => {
  console.log(params.id);
  return <div>Recipe Detail Page</div>;
};

export default RecipeDetailPage;
