// Upgrade NOTE: replaced 'mul(UNITY_MATRIX_MVP,*)' with 'UnityObjectToClipPos(*)'

Shader "Hidden/cPrecision"
{
	Properties
	{
		_MainTex ("Texture", 2D) = "white" {}
		_Colors("Color Precision", Float) = 0
		_Palette("Palette", 2D) = "white" {}
		_Res("Render Precision", Float) = 0
		_Filter("Filter Color",Color) = (1,1,1,1) 
	}
	SubShader
	{
		// No culling or depth
		Cull Off ZWrite Off ZTest Always

		Pass
		{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			
			#include "UnityCG.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 uv : TEXCOORD0;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				float4 vertex : SV_POSITION;
			};

			float _Res;

			v2f vert (appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos(v.vertex);
				o.uv = v.uv;
				return o;
			}
			
			sampler2D _MainTex;
			sampler2D _Palette; 
			float _usePalette;
			float _Colors;
			fixed4 _Filter;

			fixed4 frag (v2f i) : SV_Target
			{
				float2 pos = i.uv;
				if(_Res){
					pos *= _Res;
					pos = floor(pos);
					pos /= _Res;
				}
				fixed4 col = tex2D(_MainTex , pos);
				col *= _Filter;
				col *= _Colors;
				col = floor(col);
				col /= _Colors;
				if (_usePalette) col = tex2D(_Palette, float2((col.r+col.g+col.b)/3, i.uv.y));
				col *= _Filter;
				return col;
			}
			ENDCG
		}
	}
}
