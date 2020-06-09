import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import ScreenShareAgent from "./components/ScreenShareAgent";
function App() {
  return (
    <BrowserRouter forceRefresh={true}>
      <div className="App">
        <Route
          path="/screen"
          render={(props: {}) => <ScreenShareAgent {...props} />}
        ></Route>
      </div>
    </BrowserRouter>
  );
}

export default App;
