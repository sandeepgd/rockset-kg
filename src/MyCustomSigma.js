import React, { Component } from 'react';
import {onClickNode, onClickEdge, EdgeShapes, NodeShapes, Sigma, RandomizeNodePositions, RelativeSize} from 'react-sigma';
import axios from 'axios';

export default class MyCustomSigma extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rootNodeMid: "/m/123",
      rootNodeLabel: "",
    };
    this.myGraph = {nodes:[],
      edges:[]
    };
  }

  componentDidMount() {
    console.log("process.env: ", process.env);
    console.log("process.env.REACT_APP_ROCKSET_API_KEY: ", process.env.REACT_APP_ROCKSET_API_KEY);
    this.refreshGraph(this.state.rootNodeMid);
  }

  onClickNodeFunc = (e) => {
    console.log("Clicked " + e.data.node.label);
    if (!this.isMid(e.data.node.id)) return;
    this.refreshGraph(e.data.node.id);
  }

  isMid = (label) => {
    return label.startsWith("/m/");
  }

  getNodeNamePromise = (mid) => {
    return axios.post("https://api.rs2.usw2.rockset.com/v1/orgs/self/queries",
                {
                  "sql": {
                    "query": "SELECT * from dummy_kg where subject = '" + mid + "' and predicate = 'name' limit 1",
                    "parameters": [
                      {
                        "name": "string",
                        "type": "string",
                        "value": "string"
                      }
                    ]
                  }
                },
                {
                  headers: {
                    Authorization: process.env.REACT_APP_ROCKSET_API_KEY
                  }
                }
      );
  }

  refreshGraph(rootNodeMid) {
      axios.post("https://api.rs2.usw2.rockset.com/v1/orgs/self/queries",
                {
                  "sql": {
                    "query": "SELECT * from dummy_kg where subject = '" + rootNodeMid + "'",
                    "parameters": [
                      {
                        "name": "string",
                        "type": "string",
                        "value": "string"
                      }
                    ]
                  }
                },
                {
                  headers: {
                    Authorization: process.env.REACT_APP_ROCKSET_API_KEY
                  }
                }
      ).then(res => {
        console.log("response: ", res.data.results);
        this.myGraph.nodes = [];
        this.myGraph.edges = [];
        let rootNodeLabel;
        res.data.results.forEach((row) => {
          if (row.predicate === "name") {
            rootNodeLabel = row.object;
          }
        });
        this.addVertex(rootNodeMid, rootNodeLabel);

        let nodeNamePromises = [];
        let nodeNamePredicates = [];
        res.data.results.forEach((row, index) => {
          if (this.isMid(row.object)) {
            nodeNamePromises.push(this.getNodeNamePromise(row.object));
            nodeNamePredicates.push(row.predicate.replace("_", " "));
          } else if (row.predicate === "name") {
            // ignore
          } else {
            const newNodeId = "rawnode-" + index;
            const edgeLabel = row.predicate.replace("_", " ");
            this.addVertex(newNodeId, row.object);
            this.addEdge("edge-" + newNodeId, newNodeId, rootNodeMid, edgeLabel);
          }
        });
        Promise.all(nodeNamePromises).then(promiseResults => {
          console.log("promiseRes before crash: ", promiseResults);
          promiseResults.forEach((res2, index) => {
            if (res2.data.results.length !== 1) return;
          
            const row = res2.data.results[0];
            const newNodeId = row.subject;
            const edgeLabel = nodeNamePredicates[index];
            this.addVertex(newNodeId, row.object);
            this.addEdge("edge-" + newNodeId, newNodeId, rootNodeMid, edgeLabel);
          });

          // Finally update node id and label so that Sigma gets re-rendered.
          this.setState({rootNodeMid, rootNodeLabel});
        });
      });
  }

  addVertex = (id, label) => {
    this.myGraph.nodes.push({id, label});
  };

  addEdge = (id, source, target, label) => {
    this.myGraph.edges.push({id, source, target, label});
  };

  render() {
    return (
      <Sigma graph={this.myGraph}
             key={this.state.rootNodeMid + "-" + this.state.rootNodeLabel}
             settings={{
              drawEdges: true,
              drawLabels: true,
              drawEdgeLabels: true,
              clone: false,
              defaultNodeColor: '#FF530D',
              defaultEdgeColor: '#FFB87C',
              minNodeSize: 8,
              maxNodeSize: 10,
              defaultLabelSize: 12
             }}
             renderer="canvas"
             style={{maxWidth:"inherit", height:"800px"}}
             onClickNode={this.onClickNodeFunc}
             onClickEdge={e => console.log("Clicked")}
             >
        <EdgeShapes default="tapered"/>
        <NodeShapes/>
        <RelativeSize initialSize={15}/>
        <RandomizeNodePositions/>
      </Sigma>
      );
  }
}